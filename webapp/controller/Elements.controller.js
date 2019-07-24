sap.ui.define([
	"sap/ui/core/mvc/Controller"
], function (Controller) {
	"use strict";

	return Controller.extend("glacelx.glacelx.controller.Elements", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf glacelx.glacelx.view.AllElements
		 */
		onInit: function () {
		},
		
		
		onToIntro: function () { 
   			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("intro");
   		},
   		
   		onSystemList: function () {
   			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("systems");   			
   		},
   		
   		onPartPressed: function (oEvent) {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			var partIdx = "1"; 
			var sysIdx = "1";

 			oRouter.navTo("part",{
				sysIndex: sysIdx,
				partIndex: partIdx
			}); 
		}

		/**
		 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
		 * (NOT before the first rendering! onInit() is used for that one!).
		 * @memberOf glacelx.glacelx.view.AllElements
		 */
		//	onBeforeRendering: function() {
		//
		//	},

		/**
		 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
		 * This hook is the same one that SAPUI5 controls get after being rendered.
		 * @memberOf glacelx.glacelx.view.AllElements
		 */
		//	onAfterRendering: function() {
		//
		//	},

		/**
		 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
		 * @memberOf glacelx.glacelx.view.AllElements
		 */
		//	onExit: function() {
		//
		//	}

	});

});