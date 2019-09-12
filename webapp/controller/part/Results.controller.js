sap.ui.define([
	"../BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/mvc/XMLView",
	"sap/ui/model/resource/ResourceModel",
	"sap/base/Log",
	"../../model/formatter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function (BaseController, JSONModel, XMLView, ResourceModel, Log, formatter, Filter, FilterOperator) {
	"use strict";

	return BaseController.extend("glacelx.glacelx.controller.part.Results", {
		onInit: function () {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			var route = oRouter.getRoute("part");
			route.attachMatched(this._onRouteMatched, this);
			this.oView = this.getView();
			this._checkInitialModel();
			this.oModel = this.getOwnerComponent().getModel("userXML");
			var tabs = this.getView().byId("iconTabBar");
		},

		valueCheck: function (oEvent) {
			var oArgs = oEvent.getParameter("arguments");
		},

		_onRouteMatched: function (oEvent) {
			var oArgs = oEvent.getParameter("arguments");

			// This variable must have the name 'path' as it is checked in ManagedObject-dbg.js!! 
			// model name will be checked, everything before '>''
			// var path = "lawFile>/Systems(" + parseInt(oArgs.index) + ")";

			// create binding for System Details
			var sysIdx = oArgs.sysIndex;
			var partIdx = oArgs.partIndex;

			// bind part properties
			var sPath = "/Parts/" + partIdx;
			var oForm = this.oView.byId("selectedResult");
			oForm.bindElement({
				path: sPath,
				model: "lawFile",
				events: {
					change: this._onBindingChange.bind(this),
					dataRequested: function (oEvent) {
						this.oView.setBusy(true);
					},
					dataReceived: function (oEvent) {
						this.oView.setBusy(false);
					}
				}
			});
			oForm = this.oView.byId("resultPage");

			// navigate to part branch and extract data
			var _mainModelRaw = this.oModel.getData().children[0];
			var _rawSystemData = _mainModelRaw._tagMeasurementPartsHook.children[partIdx];
			// set code editor context
			var _oSysCodeEditor = this.oView.byId("resultsCE");
			// build editor context
			this.buildEditorContext(_rawSystemData, _oSysCodeEditor);
		},

		_onBindingChange: function (oEvent) {
			// No data for the binding
			if (!this.getView().byId("selectedResult").mElementBindingContexts) {
				// this.getRouter().getTargets().display("notFound");
				Log.error("System number can't be found");
			}
		}
	});
});