sap.ui.define([
	"./BaseController"
], function (BaseController) {
	"use strict";

	return BaseController.extend("sap.support.zglacelx.controller.ErrorPage", {
		onInit: function () {
			this.checkCurrentBrowser();
		}
	});

});