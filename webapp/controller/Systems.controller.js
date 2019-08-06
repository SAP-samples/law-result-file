sap.ui.define([
	"./BaseController",
	"sap/base/Log",

], function (BaseController, Log) {
	"use strict";

	return BaseController.extend("glacelx.glacelx.controller.Systems", {

		onInit: function () {
			var _oModel = this.getOwnerComponent().getModel("userXML");
			this.getView().setModel(_oModel);
		},

		onToAll: function () {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("elements");
		},

		onSystemPressed: function (oEvent) {
			var oItem = oEvent.getSource();
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			var oContextPath = oItem.getBindingContextPath();
			var sysIdx = oContextPath.substr("/Systems/System/".length);
			oRouter.navTo("system", {
				sysIndex: sysIdx
			});
		},

		onAfterRendering: function () {
        	var ul = this.getView().byId("systemList");
   			var items = ul.getItems();
   			for (var index in items) {
   				items[index].addStyleClass("lineBreak");
   			}
		},
   		
   		onSystemUpdate: function() {
   			var ul = this.getView().byId("systemList");
   			var items = ul.getItems();
   			for (var index in items) {
   				items[index].addStyleClass("lineBreak");
   			}
		},
        
		getAppObject: function () {
			var result = this.byId("systemListApp");
			if (!result) {
				Log.error("systemListApp object can't be found");
			}
			return result;
		}
	});
});