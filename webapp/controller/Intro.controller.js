sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/resource/ResourceModel"
	
], function (Controller, ResourceModel) {
	"use strict";

	return Controller.extend("glacelx.glacelx.controller.Intro", {
		onInit: function () {
			// set i18n model on view
			var i18nModel = new ResourceModel({
				bundleName: "glacelx.glacelx.i18n.i18n"
			});
			this.getView().setModel(i18nModel, "i18n");
		},
		
		onUseExampleFile: function () { 
   			var dataModel = this.getOwnerComponent().getModel("lawFile");
   			this.getView().setModel(dataModel, "lawFile");
   			
   			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("elements");

   		}
	});
});