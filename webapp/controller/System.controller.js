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

	return BaseController.extend("glacelx.glacelx.controller.System", {
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
			this._sBindingPath = "/Systems/System/" + this._sysIndex;
			// get raw data from model
			var _mainModelRaw = this._oModel.getData().children[0];
			// navigate to system branch and extract data
			var _rawSystemData = _mainModelRaw._tagMeasurementSystemsHook.children[this._sysIndex];

			// bind system context to page (this is needed for displaying the title)
			var _oPage = this.oView.byId("SystemView");
			_oPage.bindElement(this._sBindingPath);

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
			var _partsListBinding = _partsList.getBinding("items");
			var _systemNo = this._oModel.getProperty(this._sBindingPath + "/SystemNo");
			var oPartTableFilter = new Filter({
				path: "SystemNo",
				operator: FilterOperator.EQ,
				value1: _systemNo
			});
			_partsListBinding.filter(oPartTableFilter);

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
				template: exportTableTemplate
			});
		},
		
		resultCount: function (sPartId) {
			if (sPartId) {
				sPartId = sPartId.trim();
				var _mainModelRaw = this._oModel.getData().children[0];
				var _results = _mainModelRaw._tagMeasurementResultsHook.children;
				for (var i = 0; i < _results.length; ++i) {
					var resPartId = _results[i].children[0].textContent.trim();
					if (resPartId === sPartId) {
						var count = _results[i].children.length - 1; // first line is the PartId, all other lines are Results
						return count + " " +   this.getView().getModel("i18n").getResourceBundle().getText("result.ResultLines.text");
					}
				}
			}	
			// if no result was found (can happen), so return -1
			return "No results";
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

		onPartPressed: function (oEvent) {
			this.getView().setBusy();
			var oItem = oEvent.getSource();
			var oContextPath = oItem.getBindingContextPath();
			// var sysIdx = oContext.getPath();
			var indexInPartsBlock = oContextPath.substr("/Parts/Part/".length);
			
			// could select System with properties like SAP_SID, SystemNo, ...
			// var selectedSyst = oCtx.getObject();
			this.oRouter.navTo("part", {
				partIndex: indexInPartsBlock,
				sysIndex: this._sysIndex
			});
		},

		navToFirstSystem: function () {
			this.oRouter.navTo("system", {
				sysIndex: 0
			});
		},

		navToNextSystem: function () {
			var _iSysTarget = parseInt(this._sysIndex) + 1;
			if (_iSysTarget <= (this.iSystemsCount - 1)) {
				this.oRouter.navTo("system", {
					sysIndex: _iSysTarget
				});
			}
		},

		navToPrevSystem: function () {
			var _iSysTarget = parseInt(this._sysIndex) - 1;
			if (_iSysTarget >= 0) {
				this.oRouter.navTo("system", {
					sysIndex: _iSysTarget
				});
			}
		},

		navToLastSystem: function () {
			var _iSysTarget = this.iSystemsCount - 1;
			this.oRouter.navTo("system", {
				sysIndex: _iSysTarget
			});
		}
	});
});