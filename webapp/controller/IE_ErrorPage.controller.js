sap.ui.define([
	"./BaseController"
], function (BaseController) {
	"use strict";

	return BaseController.extend("sap.support.zglacelx.controller.IE_ErrorPage", {
		onInit: function () {
			this.checkCurrentBrowser();
		},
		
		checkCurrentBrowser: function () {
			var bBrowserCheck = sap.ui.Device.browser.msie === true;
			if (!bBrowserCheck) {
				var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
				oRouter.navTo("intro");
			} 
		}
	});

});