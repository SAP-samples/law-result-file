sap.ui.define([
	"./BaseController",
	"./layout/EqualWidthColumns",
	"sap/ui/core/mvc/XMLView",
	"sap/ui/model/resource/ResourceModel",
	"sap/base/Log",
	"../model/formatter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"./layout/ResultLine"

], function (BaseController, EqualWidthColumns, XMLView, ResourceModel, Log, formatter, Filter, FilterOperator, ResultLine) {
	"use strict";

	return BaseController.extend("sap.support.zglacelx.Component.controller.System", {
		formatter: formatter,

		onInit: function () {
			this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.oRoute = this.oRouter.getRoute("system");
			this._checkInitialModel();
			this._oModel = this.getOwnerComponent().getModel("userXML");
			this.oView = this.getView();
			this.iSystemsCount = this._oModel.getData().children[0]._tagMeasurementSystemsHook.childElementCount;
            this.oView.setModel(this._oModel);
			this.oRoute.attachMatched(this._onRouteMatched, this);			
		},

		_onRouteMatched: function (oEvent) {
			// check that model is not empty
			// check if arguments are within range
			// if any condition fails route back to start
			var oArgs = oEvent.getParameter("arguments");
			this._sysIndex = oEvent.getParameter("arguments").sysIndex;

			// console.log("onRouteMatched system index=" + this._sysIndex);
			var ddList = this.oView.byId("drop");
			ddList = this._getCodeSelector(ddList, "system/" + this._sysIndex);	
            
            this.oView = this.getView();
            this._checkInitialModel();
			var oEmptyModel = new sap.ui.model.json.JSONModel();
			this._oModel = oEmptyModel;			
			this._oModel = this.getOwnerComponent().getModel("userXML");			
			this.iSystemsCount = this._oModel.getData().children[0]._tagMeasurementSystemsHook.childElementCount;

			this._sBindingPath = "/Systems/System/" + this._sysIndex;
			// get raw data from model
			var _mainModelRaw = this._oModel.getData().children[0];
	
			// navigate to system branch and extract data
			var _rawSystemData = _mainModelRaw._tagMeasurementSystemsHook.children[this._sysIndex];

			// bind system context to page (this is needed for displaying the title)
			var _oPage = this.oView.byId("SystemView");
			var systemSid = "";
			_oPage.bindElement(this._sBindingPath); // causes exception on second system cycle
			if (_rawSystemData && _rawSystemData.childElementCount) {
				for (var i=0; i < _rawSystemData.childElementCount; i++) {
					if (_rawSystemData.children[i].tagName.toUpperCase() === "SAP_SID") {
						systemSid = _rawSystemData.children[i].textContent;
						break;
					}
				}
			}
			_oPage.setTitle(
				jQuery.sap.formatMessage(this.getView().getModel("i18n").getResourceBundle().getText("system.page.title"),
				systemSid));

			// set context binding for dataForm
			var _oAttributeForm = this.getView().byId("dataForm");
			_oAttributeForm.bindElement(this._sBindingPath);
			// set index field
			var _indexField = this.oView.byId("systemIdx");
			_indexField.setText(this._sysIndex);

			// set editor context
			var _sysCodeEditor = this.byId("systemCodeEditor");
			this.buildEditorContext(_rawSystemData, _sysCodeEditor);

			// get partsList binding and apply filter
			var _partsList = this.oView.byId("partsList");
			_partsList.removeAllItems();
			var _systemNo = this._oModel.getProperty(this._sBindingPath + "/SystemNo");
			var allParts = this._oModel.getData().children[0]._tagMeasurementPartsHook;
			for (var i=allParts.childElementCount - 1; i >=0 ; i--) {
				var nextPart = allParts.children[i];
				var npPartId = "";
				var npGenericId = "";
				var npSystemNo = "";
				var npSAP_CLIENT = "";
				var npPartName = ""; // "[" + i + "]";
				// read attribute values of the part
				for (var a=0; a < nextPart.childElementCount; a++) {
					var npAttrName = nextPart.children[a].tagName.toUpperCase();
					var npAttrVal  = nextPart.children[a].textContent;
					if (npAttrName === "PARTID")		{ npPartId = npAttrVal; }
					if (npAttrName === "GENERICID")		{ npGenericId = npAttrVal; }
					if (npAttrName === "SYSTEMNO")		{ npSystemNo = npAttrVal; }
					if (npAttrName === "SAP_CLIENT")	{ npSAP_CLIENT = npAttrVal; }
					if (npAttrName === "NAME")			{ npPartName = npPartName + npAttrVal; }
				}
				if (npSystemNo === _systemNo) {

					// this part belongs to the current system, so render it
					var npCustomListItem = new sap.m.CustomListItem({
															type: sap.m.ListType.Navigation,
															press: this.onDynPartPressed.bind(this, i) });
					npCustomListItem.addStyleClass("sapContrast");
					npCustomListItem.addStyleClass("noBreak");
					npCustomListItem.addStyleClass("lawItem");
					
					var npVBoxOuter = new sap.m.VBox();
					npVBoxOuter.addStyleClass("sapUiTinyMargin");
					npVBoxOuter.addStyleClass("sapUiNoMarginEnd");
					
					var npHBox = new sap.m.HBox();
					npHBox.addStyleClass("sapUiNoMargin");
					
					var npIcon = new sap.ui.core.Icon({
													src: "sap-icon://it-instance",
													size: "2.3rem" });
					npIcon.addStyleClass("sapUiTinyMargin");
					
					var npVBoxInner = new sap.m.VBox();
					npVBoxInner.addStyleClass("sapUiTinyMargin");
					npVBoxInner.addStyleClass("sapUiNoMarginBottom");
					npVBoxInner.addStyleClass("sapUiNoMarginEnd");
													
					var npLabel1 = new sap.m.Label({
												text: formatter.formatClientRb(npSAP_CLIENT, npGenericId, npPartId, 
																				this.getView().getModel("i18n").getResourceBundle()),
												wrapping: true});
					var npLabel2 = new sap.m.Label({
												text: this.resultCount(npPartId) });
					var npLabel3 = new sap.m.Label({
												text: npPartName });
					
					// assamble UI
					npVBoxInner.addItem(npLabel1);
					npVBoxInner.addItem(npLabel2);
					npHBox.addItem(npIcon);
					npHBox.addItem(npVBoxInner);
					npVBoxOuter.addItem(npHBox);
					npVBoxOuter.addItem(npLabel3);
					npCustomListItem.addContent(npVBoxOuter);
					_partsList.addItem(npCustomListItem);
				}
			}

			// bind exportTable
			var _exportTable = this.oView.byId("exportTable");
			var sComponentBindingPath = this._sBindingPath + "/Components/Component";
			// caution - template binding will fail if one of the three tags is missing!
			var exportTableTemplate = new sap.m.ColumnListItem({
				cells: [
					new sap.m.Label({
						text: "{Name}"
					}),
					new sap.m.Label({
						text: "{Release}"
					}),
					new sap.m.Label({
						text: "{PatchLevel}"
					})
				]
			});
			_exportTable.bindItems({
				path: sComponentBindingPath,
				// length: 15,
				template: exportTableTemplate
			});		
		},
		
		resultCount: function (sPartId) {
			var _mainModelRaw = this._oModel.getData().children[0];
			var _results = _mainModelRaw._tagMeasurementResultsHook.children;
			
			if (sPartId) {
				sPartId = sPartId.trim();
				for (var i = 0; i < _results.length; ++i) {
					var resPartId = _results[i].children[0].textContent.trim();
					if (resPartId === sPartId) {
						var count = _results[i].children.length - 1; // first line is the PartId, all other lines are Results
						return jQuery.sap.formatMessage(this.getView().getModel("i18n").getResourceBundle().getText("result.ResultLines.text"),
														count);
						// return this.getView().getModel("i18n").getResourceBundle().getText("result.ResultLines.text");
					}
				}
			}
			// no results 
			return this.getView().getModel("i18n").getResourceBundle().getText("result.ResultLinesNone.text");
		},

		_onBindingChange: function (oEvent) {
			// No data for the binding
			if (!this.getView().byId("SystemView").mElementBindingContexts) {
				// this.getRouter().getTargets().display("notFound");
				Log.error("System number can`t be found");
			}
		},

		onSystemList: function () {
			this.oRouter.navTo("systems");
		},

		onDynPartPressed: function (oEvent) {
			this.getView().setBusy();
			this.oRouter.navTo("part", {
				partIndex: oEvent,
				sysIndex: this._sysIndex
			});
		},

		navToNextBlock: function() {			
			var _iSysTarget = parseInt(this._sysIndex) + 1;
			if (_iSysTarget <= (this.iSystemsCount - 1)) {
				// next system
				this.oRouter.navTo("system", {
					sysIndex: _iSysTarget
				});
			} else {
				// first part
				this.navigateToPartIndex(0);
			}
		}, 

		navToPrevBlock: function() {			
			var _iSysTarget = parseInt(this._sysIndex) - 1;
			if (_iSysTarget >= 0) {
				this.oRouter.navTo("system", {
					sysIndex: _iSysTarget
				});
			} else {				
				this.oRouter.navTo("header");
			}

		},

		onNavLoad: function() {
			this.oRouter.navTo("intro");
		},

		onNavAll: function() {
			this.oRouter.navTo("elements");
		},

		onNavSystemList: function() {
			this.oRouter.navTo("systems");

		},
	});
});