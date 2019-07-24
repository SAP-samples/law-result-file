sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/mvc/XMLView",
	"sap/ui/model/resource/ResourceModel",
	"sap/base/Log",
	"../../model/formatter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function (Controller, JSONModel, XMLView, ResourceModel, Log, formatter, Filter, FilterOperator) {
	"use strict";

	return Controller.extend("glacelx.glacelx.controller.part.Results", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf glacelx.glacelx.view.ResultLines
		 */
		onInit: function () {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			var route = oRouter.getRoute("part");
			route.attachMatched(this._onRouteMatched, this);
			
			var tabs = this.getView().byId("iconTabBar");
		},
		
		valueCheck: function (oEvent) {
			var oArgs = oEvent.getParameter("arguments");
		},

		_onRouteMatched : function (oEvent) {
			var oArgs = oEvent.getParameter("arguments");
			var oView = this.getView();
			var oModel = oView.getModel("lawFile");
			
			// This variable must have the name 'path' as it is checked in ManagedObject-dbg.js!! 
			// model name will be checked, everything before '>''
			// var path = "lawFile>/Systems(" + parseInt(oArgs.index) + ")";
			
			/// debugger;
			
			// create binding for System Details
			var sysIdx = oArgs.sysIndex;
			var partIdx = oArgs.partIndex;

			// bind part properties
			var sPath="/Parts/" + partIdx;
			var oForm = oView.byId("selectedResult");
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
			
			oForm = oView.byId("resultPage");
			
			
			// set filter for parts list
			/* var sys = oModel.getData().Systems[parseInt(oArgs.index)];
			var sysid = sys.SystemNo;
			
			var filter1 = this.oView.byId("partsList").mBindingInfos.items.filters;
			var aFilter = [];
			aFilter.push(new Filter("SystemNo", FilterOperator.EQ, sysid));
			var oBinding = this.oView.byId("partsList").getBinding("items");
			oBinding.filter(aFilter); */
			
			// temp for UI Tests with second List
			// var oBinding2 = this.oView.byId("partsList2").getBinding("items");
			// oBinding2.filter(aFilter);
		},
		
		_onBindingChange : function (oEvent) {
			// No data for the binding
			if (!this.getView().byId("selectedResult").mElementBindingContexts) {
				// this.getRouter().getTargets().display("notFound");
				Log.error("System number can't be found");
			}
		}, 

		/**
		 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
		 * (NOT before the first rendering! onInit() is used for that one!).
		 * @memberOf glacelx.glacelx.view.ResultLines
		 */
		//	onBeforeRendering: function() {
		//
		//	},

		/**
		 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
		 * This hook is the same one that SAPUI5 controls get after being rendered.
		 * @memberOf glacelx.glacelx.view.ResultLines
		 */
		//	onAfterRendering: function() {
		//
		//	},

		/**
		 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
		 * @memberOf glacelx.glacelx.view.ResultLines
		 */
		//	onExit: function() {
		//
		//	}

	});

});