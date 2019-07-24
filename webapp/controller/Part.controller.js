sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/mvc/XMLView",
	"sap/ui/model/resource/ResourceModel",
	"sap/base/Log",
	"../model/formatter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function (Controller, JSONModel, XMLView, ResourceModel, Log, formatter, Filter, FilterOperator) {
	"use strict";

	return Controller.extend("glacelx.glacelx.controller.Part", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf glacelx.glacelx.view.Results
		 */
		onInit: function () {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			var route = oRouter.getRoute("part");
			route.attachMatched(this._onRouteMatched, this);
		},
		
		_onRouteMatched : function (oEvent) {
			var oArgs, oView;
			oArgs = oEvent.getParameter("arguments");
			oView = this.getView();
			
			// bind system element to page back button
			var sysIdx = oArgs.sysIndex;
			var sPath = "/Systems/" + sysIdx;

			var oForm = oView.byId("resultPage");
			oForm.bindElement( { 
				path: sPath, 
				model: "lawFile", 
				events : {
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
			var oModel = this.getOwnerComponent().getModel("lawFile");
			//var oModel = oView.getModel("lawFile");
			var sys = oModel.getData().Systems[parseInt(sysIdx)];
			
			// i18n - get resource bundle 
			var oBundle = this.getView().getModel("i18n").getResourceBundle();
			var iSysText = oBundle.getText("model.systems.System.text"); 
			var iClientText = oBundle.getText("part.page.client.text"); 
			var iPartText = oBundle.getText("part.page.title"); 

			if (sys) {
				if (sys.SAP_SID) {
					sysLabel = iSysText + " " + sys.SAP_SID;
				} else if (sys.SystemNo) {
					var sysNo = parseFloat(sys.SystemNo);
					sysLabel = iSysText + " " + sysNo;
				} else {
					sysLabel = iSysText + " #" + sysIdx;
				}
			}
			
			// get client number or fallback: part index
			var partIdx = oArgs.partIndex;
			var part = oModel.getData().Parts[parseInt(partIdx)];
			if (part) {
				if (part.SAP_CLIENT) {
					partLabel = " - " + iClientText + part.SAP_CLIENT;
				} else {
					partLabel = ""; // Part #" + partIdx;
				};
			};

			oForm.setTitle(iPartText + partIdx + " / "+ sysLabel +  partLabel);
		},
		
		_onBindingChange : function (oEvent) {
			// No data for the binding
			if (!this.getView().byId("resultPage").mElementBindingContexts) {
				// this.getRouter().getTargets().display("notFound");
				Log.error("[Result page/Part.controller] System number can't be found");
			}
		},

		backToSystem: function (oEvent) {
			var oView = this.getView();
			var oForm = oView.byId("resultPage");
			var ctx = oForm.getBindingContext("lawFile");
			var sysIdx = ctx.sPath;
			sysIdx = sysIdx.substr("/Systems/".length);
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("system",{
				sysIndex: sysIdx
			}); 
		},

		/**
		 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
		 * (NOT before the first rendering! onInit() is used for that one!).
		 * @memberOf glacelx.glacelx.view.Results
		 */
		//	onBeforeRendering: function() {
		//
		//	},

		/**
		 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
		 * This hook is the same one that SAPUI5 controls get after being rendered.
		 * @memberOf glacelx.glacelx.view.Results
		 */
		//	onAfterRendering: function() {
		//
		//	},

		/**
		 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
		 * @memberOf glacelx.glacelx.view.Results
		 */
		//	onExit: function() {
		//
		//	}

	});

});