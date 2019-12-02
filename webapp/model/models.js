sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device"
], function (JSONModel, Device) {
	"use strict";

	return {

		createDeviceModel: function () {
			var _oModel = new JSONModel(Device);
			_oModel.setDefaultBindingMode("OneWay");
			return _oModel;
		}

	};
});