sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/mvc/XMLView",
	"sap/ui/model/resource/ResourceModel",
	"sap/base/Log",
	"../model/formatter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function (BaseController, JSONModel, XMLView, ResourceModel, Log, formatter, Filter, FilterOperator) {
	"use strict";

	return BaseController.extend("glacelx.glacelx.controller.Part", {
		onInit: function () {
			this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			var route = this.oRouter.getRoute("part");
			this.oModel = this.getOwnerComponent().getModel("userXML");
			route.attachMatched(this._onRouteMatched, this);
		},

		_onRouteMatched: function (oEvent) {
			var oArgs, oView;
			oArgs = oEvent.getParameter("arguments");
			oView = this.getView();
			this.sysIdx = oArgs.sysIndex;
			this.sPath = "/Systems/System/" + this.sysIdx;

			// bind system element to page back button
			var oForm = oView.byId("resultPage");
			oForm.bindElement({
				path: this.sPath,
				events: {
					change: this._onBindingChange.bind(this),
					dataRequested: function (oEvent) {
						oView.setBusy(true);
					},
					dataReceived: function (oEvent) {
						oView.setBusy(false);
					}
				}
			});

			// Build title for Result page, e.g. "Results for System C31, Client 100"
			var sysLabel = "(unknown)";
			var partLabel = sysLabel;
			// get system label (SID or fallback: SystemNo)
			var _iSAP_SID = this.oModel.getProperty(this.sPath + "/SAP_SID");
			var _iSystemNo = this.oModel.getProperty(this.sPath + "/SystemNo");
			var _oSys = this.oModel.getProperty(this.sPath);

			// i18n - get resource bundle 
			var oBundle = this.getView().getModel("i18n").getResourceBundle();
			var iSysText = oBundle.getText("model.systems.System.text");
			var iClientText = oBundle.getText("part.page.client.text");
			var iPartText = oBundle.getText("part.page.title");
			
			if (_oSys) {
				if (_iSAP_SID) {
					sysLabel = iSysText + " " + _iSAP_SID;
				} else if (_iSystemNo) {
					var sysNo = parseFloat(_iSystemNo);
					sysLabel = iSysText + " " + sysNo;
				} else {
					sysLabel = iSysText + " #" + this.sysIdx;
				}
			}

			// get client number or fallback: part index
			var partIdx = oArgs.partIndex;
			var iPartsPath = "/Parts/Part/" + partIdx;
			var _sSAP_CLIENT = this.oModel.getProperty(iPartsPath + "/SAP_CLIENT");

			if (iPartsPath) {
				if (_sSAP_CLIENT) {
					partLabel = " - " + iClientText + _sSAP_CLIENT;
				} else {
					partLabel = ""; // Part #" + partIdx;
				}
			}

			oForm.setTitle(iPartText + partIdx + " / " + sysLabel + partLabel);
		},

		_onBindingChange: function (oEvent) {
			// No data for the binding
			if (!this.getView().byId("resultPage").mElementBindingContexts) {
				// this.getRouter().getTargets().display("notFound");
				Log.error("[Result page/Part.controller] System number can't be found");
			}
		},

		backToSystem: function (oEvent) {
			this.oRouter.navTo("system", {
				sysIndex: this.sysIdx
			});
		}
	});
});