sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/UIComponent",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast",
	"sap/base/Log"
], function (Controller, UIComponent, JSONModel, MessageToast, Log) {
	"use strict";

	var _oBundle; // holds the resource bundle for text translation

	return Controller.extend("glacelx.glacelx.controller.BaseController", {
		onInit: function () {

		},

		_xmlModelBranchContains: function (oBranch, sNamedChild) {
			return false;
		},

		_checkInitialModel: function () {
			var that = this;
			var oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
			var _oModel = that.getOwnerComponent().getModel("userXML");
			if (_oModel.getData()) {
				try {
					if (_oModel.getData().hasChildNodes()) {
						if (_oModel.getData().children[0]._tagDepth === undefined || _oModel.getData().children[0]._tagClass === undefined || _oModel
							.getData()
							.children[0]._tagLineStart === undefined) {
							that._processXML(_oModel.getData());
						}
					} else {
						_oModel.setXML(oStorage.get("xmlLocalStorage"));
						that._processXML(_oModel.getData());
					}
				} catch (err) {
					_oModel.setXML(oStorage.get("xmlLocalStorage"));
					that._processXML(_oModel.getData());
				}
			} else {
				_oModel.setXML(oStorage.get("xmlLocalStorage"));
				that._processXML(_oModel.getData());
			}
		},

		__convertModelToString: function (node) {
			var _retString = "";

			// leaf nodes
			if (!node.children || node.children.length === 0) {
				var _sLTabSpace = "";
				for (var _dCount = 0; _dCount < node._tagDepth; ++_dCount) {
					_sLTabSpace += "    ";
				}

				if (node.textContent != "") {
					_retString = _sLTabSpace + _retString + "<" + node.tagName + ">" + node.textContent + "</" + node.tagName + ">\n";
				} else {
					_retString = _sLTabSpace + _retString + "<" + node.tagName + "/>\n";
				}

				return _retString;
			}
			// parent node
			else if (node.children.length > 0) {
				var _sCTabSpace = "";
				for (var _eCount = 0; _eCount < node._tagDepth; ++_eCount) {
					_sCTabSpace += "    ";
				}
				_retString = _sCTabSpace + "<" + node.tagName + ">\n" + _retString;

				// call all children
				for (var i = 0; i < node.children.length; ++i) {
					_retString += this.__convertModelToString(node.children[i]);
				}

				_retString = _retString + _sCTabSpace + "</" + node.tagName + ">\n";
				return _retString;
			} else {}
		},

		buildEditorContext: function (node, oCodeEditor) {
			if (!node) {
				_oBundle = this.getView().getModel("i18n").getResourceBundle();
				oCodeEditor.setValue(_oBundle.getText("part.nodata.text"));
				oCodeEditor.setEditable(false);
				oCodeEditor.setType("xml");
				return;
			}
			var _sXMAS = this.__convertModelToString(node);

			// remove last line break (otherwise we are left with an empty last line)
			_sXMAS = _sXMAS.slice(0, -1);

			this.buildEditor(_sXMAS, oCodeEditor, node._tagLineStart);
		},

		buildEditor: function (codeStr, oCodeEditor, firstLineNumber) {
			if (!codeStr) {
				_oBundle = this.getView().getModel("i18n").getResourceBundle();
				oCodeEditor.setValue(_oBundle.getText("part.nodata.text"));
				oCodeEditor.setEditable(false);
				oCodeEditor.setType("xml");
				return;
			}

			// WARNING: This is a direct call to the ACE settings and might break
			// if the ACE interface changes. Reference:
			// https://github.com/ajaxorg/ace/wiki/Configuring-Ace#session-options
			// set maxLines to a very large numbers to prevent scroll bars
			oCodeEditor._oEditor.setOptions({
				firstLineNumber: firstLineNumber,
				maxLines: 100000000
			});
			oCodeEditor.setValue(codeStr);
			oCodeEditor.setEditable(false);
			oCodeEditor.setType("xml");
		},

		_getCorrespondingSystem: function (iPartIndex) {
			var tModel = this.getOwnerComponent().getModel("userXML");
			var _iSysNo = tModel.getProperty("/Parts/Part/" + iPartIndex + "/SystemNo");
			var systems = tModel.getData().children[0]._tagMeasurementSystemsHook.children;
			for (var i = 0; i < systems.length; ++i) {
				if (systems[i].children[0].textContent === _iSysNo) {
					return i;
				}
			}

			// if no system was found return -1
			return -1;
		},

		_getCorrespondingResultIndex: function (iPartIndex) {
			var _iPartId = this.getOwnerComponent().getModel("userXML").getProperty("/Parts/Part/" + iPartIndex + "/PartId").trim();
			// console.log("  Search for PartId " + _iPartId);
			var results = this._oModel.getData().children[0]._tagMeasurementResultsHook.children;
			for (var i = 0; i < results.length; ++i) {
				var resPartId = results[i].children[0].textContent.trim();
				// console.log("  Test " + resPartId + " === " + _iPartId);
				if (resPartId === _iPartId) {
					return i;
				}
			}
			// if no result was found (can happen), so return -1
			return -1;
		},

		storeLocalRawXML: function (oData) {
			var oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
			oStorage.put("xmlLocalStorage", oData);
		},

		_processXML: function (node) {
			var that = this;
			that._processXMLElement(node, 0, -2);
		},

		_processXMLElement: function (node, lastPos, lastDepth) {
			// leaf node
			var that = this;
			if (node.children && node.children.length === 0) {
				node._tagLineStart = lastPos + 1;
				node._tagLineEnd = node._tagLineStart;
				node._tagClass = "leaf";
				node._tagDepth = lastDepth + 1; // we do not want to return this change				
				if (node.parentNode && node.parentNode._tagMetaBlockAssociationName === "Header") {
					node._tagMetaBlockAssociationName = "Header";
					node._tagMetaBlockAssociationHook = node.parentNode._tagMetaBlockAssociationHook;
				} else if (node.parentNode && node.parentNode._tagMetaBlockAssociationName === "Systems") {
					node._tagMetaBlockAssociationName = "Systems";
					node._tagMetaBlockAssociationHook = node.parentNode._tagMetaBlockAssociationHook;
				} else if (node.parentNode && node.parentNode._tagMetaBlockAssociationName === "Parts") {
					node._tagMetaBlockAssociationName = "Parts";
					node._tagMetaBlockAssociationHook = node.parentNode._tagMetaBlockAssociationHook;
				} else if (node.parentNode && node.parentNode._tagMetaBlockAssociationName === "Results") {
					node._tagMetaBlockAssociationName = "Results";
					node._tagMetaBlockAssociationHook = node.parentNode._tagMetaBlockAssociationHook;
				}
				return {
					lPos: node._tagLineStart,
					lDepth: lastDepth
				};
			}
			// parent node
			else if (node.children && node.children.length > 0) {
				// MISSING: _tagLineEnd
				node._tagLineStart = lastPos + 1;
				node._tagDepth = lastDepth + 1;
				node._tagClass = "parent";
				// identify Measurement block
				if (node.tagName === "Measurement" && node.parentNode.parentNode === null) {
					node._tagMetaBlockAssociationName = "Measurement";
					node._tagMetaBlockAssociationHook = node;

					// set hooks to components if available
					for (var k = 0; k < node.children.length; ++k) {
						switch (node.children[k].tagName) {
						case "Header":
							node._tagMeasurementHeaderHook = node.children[k];
							break;
						case "Systems":
							node._tagMeasurementSystemsHook = node.children[k];
							break;
						case "Parts":
							node._tagMeasurementPartsHook = node.children[k];
							break;
						case "Results":
							node._tagMeasurementResultsHook = node.children[k];
							break;
						}
					}
				} else if (node.parentNode && node.parentNode._tagMetaBlockAssociationName === "Measurement" && node.tagName === "Header") {
					node._tagMetaBlockAssociationName = "Header";
					node._tagMetaBlockAssociationHook = node;
				} else if (node.parentNode && node.parentNode._tagMetaBlockAssociationName === "Measurement" && node.tagName === "Systems") {
					node._tagMetaBlockAssociationName = "Systems";
					node._tagMetaBlockAssociationHook = node;
				} else if (node.parentNode && node.parentNode._tagMetaBlockAssociationName === "Measurement" && node.tagName === "Parts") {
					node._tagMetaBlockAssociationName = "Parts";
					node._tagMetaBlockAssociationHook = node;
				} else if (node.parentNode && node.parentNode._tagMetaBlockAssociationName === "Measurement" && node.tagName === "Results") {
					node._tagMetaBlockAssociationName = "Results";
					node._tagMetaBlockAssociationHook = node;
				} else if (node.parentNode && node.parentNode._tagMetaBlockAssociationName === "Header") {
					node._tagMetaBlockAssociationName = "Header";
					node._tagMetaBlockAssociationHook = node.parentNode._tagMetaBlockAssociationHook;
				} else if (node.parentNode && node.parentNode._tagMetaBlockAssociationName === "Systems") {
					node._tagMetaBlockAssociationName = "Systems";
					node._tagMetaBlockAssociationHook = node.parentNode._tagMetaBlockAssociationHook;
				} else if (node.parentNode && node.parentNode._tagMetaBlockAssociationName === "Parts") {
					node._tagMetaBlockAssociationName = "Parts";
					node._tagMetaBlockAssociationHook = node.parentNode._tagMetaBlockAssociationHook;
				} else if (node.parentNode && node.parentNode._tagMetaBlockAssociationName === "Results") {
					node._tagMetaBlockAssociationName = "Results";
					node._tagMetaBlockAssociationHook = node.parentNode._tagMetaBlockAssociationHook;
				} else {
					node._tagMetaBlockAssociationName = "invalid";
				}

				// initial values
				var _oCallValues = {};
				_oCallValues.lPos = node._tagLineStart;
				_oCallValues.lDepth = node._tagDepth;

				// call all children
				for (var i = 0; i < node.children.length; ++i) {
					_oCallValues = that._processXMLElement(node.children[i], _oCallValues.lPos, _oCallValues.lDepth);
				}

				// increase line position and ajdust its value in _oCallValues
				_oCallValues.lPos++;
				_oCallValues.lDepth = lastDepth;

				return _oCallValues;
			}
		}
	});
});