sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"glacelx/glacelx/model/models"
], function (UIComponent, Device, models) {
	"use strict";

	return UIComponent.extend("glacelx.glacelx.Component", {

		metadata: {
			manifest: "json"
		},
		init: function () {
			UIComponent.prototype.init.apply(this, arguments);
			this.getRouter().initialize();
			this.setModel(models.createDeviceModel(), "device");
		}
	});
});