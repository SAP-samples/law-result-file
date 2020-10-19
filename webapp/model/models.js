sap.ui.define([
	"sap/ui/model/json/JSONModel", "sap/ui/model/xml/XMLModel",
	"sap/ui/Device"
], function (JSONModel, XMLModel, Device) {
	"use strict";

	return {

		createDeviceModel: function () {
			var _oModel = new JSONModel(Device);
			_oModel.setDefaultBindingMode("OneWay");
			return _oModel;
		},
		createUserModel: function () {
			var _oModel = new XMLModel(Device);
			_oModel.setDefaultBindingMode("OneWay");
			return _oModel;
		}

	};
});