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

	return Controller.extend("glacelx.glacelx.controller.System", {
		formatter: formatter,
		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf glacelx.glacelx.view.Parts
		 */
		onInit: function () {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			var route = oRouter.getRoute("system");
			route.attachMatched(this._onRouteMatched, this);
		},

		_onRouteMatched : function (oEvent) {
			var oArgs, oView;
			oArgs = oEvent.getParameter("arguments");
			oView = this.getView();
			var oModel = oView.getModel("lawFile");
			
			// This variable must have the name 'path' as it is checked in ManagedObject-dbg.js!! 
			// model name will be checked, everything before '>''
			// var path = "lawFile>/Systems(" + parseInt(oArgs.index) + ")";
			
			/// debugger;
			
			// create binding for System Details
			var sPath="/Systems/" + oArgs.sysIndex;
			var oForm = oView.byId("selectedPart");
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
			
			// set filter for parts list
			var sys = oModel.getData().Systems[parseInt(oArgs.sysIndex)];
			var sysid = sys.SystemNo;
			this.oView.byId("sysIdx").setText(oArgs.sysIndex);
			
			//var oControl  = this.oView.byId("partsList");
			// var oFilter = oControl.getBinding("items").filters;
			var aFilter = [];
			aFilter.push(new Filter("SystemNo", FilterOperator.EQ, sysid));
			var oBinding = this.oView.byId("partsList").getBinding("items");
			oBinding.filter(aFilter);
			
			// temp for UI Tests with second List
			// var oBinding2 = this.oView.byId("partsList2").getBinding("items");
			// oBinding2.filter(aFilter);
		},
		
		_onBindingChange : function (oEvent) {
			// No data for the binding
			if (!this.getView().byId("selectedPart").mElementBindingContexts) {
				// this.getRouter().getTargets().display("notFound");
				Log.error("System number can`t be found");
			}
		}, 
		
		onAfterRendering: function() {
			/* debugger;
			var filter1 = this.oView.byId("partsList").mBindingInfos.items.filters;
			var aFilter = [];
			aFilter.push(new Filter("SystemNo", FilterOperator.EQ, "000000000850176859"));
			var oBinding = this.oView.byId("partsList").getBinding("items");
			oBinding.filter(aFilter);	*/
		},
		
		onSystemList: function () {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("systems"); 
		},

		onPartPressed: function (oEvent) {
			var oItem = oEvent.getSource();
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			var oCtx = oItem.getBindingContext("lawFile");
			
			var partIdx = oCtx.getPath();
			partIdx = partIdx.substr("/Parts/".length);
			
			var sysIdx = sap.ui.core.UIComponent.getRouterFor(this).oHashChanger.hash;
			sysIdx = sysIdx.substr("System/".length);

			// could select System with properties like SAP_SID, SystemNo, ...
			// var selectedSyst = oCtx.getObject();
 			oRouter.navTo("part",{
				sysIndex: sysIdx,
				partIndex: partIdx
			}); 
			
		}

		/**
		 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
		 * (NOT before the first rendering! onInit() is used for that one!).
		 * @memberOf glacelx.glacelx.view.Parts
		 */
		//	onBeforeRendering: function() {
		//
		//	},

		/**
		 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
		 * This hook is the same one that SAPUI5 controls get after being rendered.
		 * @memberOf glacelx.glacelx.view.Parts
		 */
		//	onAfterRendering: function() {
		//
		//	},

		/**
		 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
		 * @memberOf glacelx.glacelx.view.Parts
		 */
		//	onExit: function() {
		//
		//	}

	});

});