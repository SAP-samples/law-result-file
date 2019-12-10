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
			// debugger;
			var _oModel = this.getOwnerComponent().getModel("userXML");
			if (_oModel.getData()) {
				try {
					if (_oModel.getData().hasChildNodes()) {
						if (_oModel.getData().children[0]._tagDepth === undefined || _oModel.getData().children[0]._tagClass === undefined || _oModel.getData()
							.children[0]._tagLineStart === undefined) {
							this._processXML(_oModel.getData());
						}
					} else {
						this._processXML(_oModel.getData());
					}
				} catch(err) {
					var _i18nBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
					MessageToast.show(_i18nBundle.getText("elements.noData.text"));
					
					// no data / data lost (e.g. due to refresh)				
					var sampleModel = this.getOwnerComponent().getModel("sampleXML");	
					var _oModel = this.getOwnerComponent().getModel("userXML");
					_oModel.setData(sampleModel.getData());
					this._processXML(_oModel.getData());
				}
			} else {
				var _i18nBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
				MessageToast.show(_i18nBundle.getText("elements.noData.text"));				
			}
		},

		__convertModelToString: function (head) {
			var _retString = "";

			// leaf nodes
			if (!head.children || head.children.length === 0) {
				var _sLTabSpace = "";
				for (var _dCount = 0; _dCount < head._tagDepth; ++_dCount) {
					_sLTabSpace += "    ";
				}

				if (head.textContent != "") {
					_retString = _sLTabSpace + _retString + "<" + head.tagName + ">" + head.textContent + "</" + head.tagName + ">\n";
				} else {
					_retString = _sLTabSpace + _retString + "<" + head.tagName + "/>\n";
				}

				return _retString;
			}
			// parent node
			else if (head.children.length > 0) {
				var _sCTabSpace = "";
				for (var _eCount = 0; _eCount < head._tagDepth; ++_eCount) {
					_sCTabSpace += "    ";
				}
				_retString = _sCTabSpace + "<" + head.tagName + ">\n" + _retString;

				// call all children
				for (var i = 0; i < head.children.length; ++i) {
					_retString += this.__convertModelToString(head.children[i]);
				}

				_retString = _retString + _sCTabSpace + "</" + head.tagName + ">\n";
				return _retString;
			} else {}
		},

		buildEditorContext: function (head, oCodeEditor) {
			if (! head) {
				_oBundle = this.getView().getModel("i18n").getResourceBundle();
				oCodeEditor.setValue(_oBundle.getText("part.nodata.text"));
				oCodeEditor.setEditable(false);
				oCodeEditor.setType("xml");
				return;
			}
			var _sXMAS = this.__convertModelToString(head);
			
			// remove last line break (otherwise we are left with an empty last line)
			_sXMAS = _sXMAS.slice(0, -1);
			
			this.buildEditor(_sXMAS, oCodeEditor, head._tagLineStart);
		},
		
		buildEditor: function (codeStr, oCodeEditor, firstLineNumber) {
			if (! codeStr) {
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

		_processXML: function (head) {
			this._processXMLElement(head, 0, -2);
		},

		_processXMLElement: function (head, lastPos, lastDepth) {
			// leaf node
			if (head.children && head.children.length === 0) {
				head._tagLineStart = lastPos + 1;
				head._tagLineEnd = head._tagLineStart;
				head._tagClass = "leaf";
				head._tagDepth = lastDepth + 1; // we do not want to return this change				
				if (head.parentNode && head.parentNode._tagMetaBlockAssociationName === "Header") {
					head._tagMetaBlockAssociationName = "Header";
					head._tagMetaBlockAssociationHook = head.parentNode._tagMetaBlockAssociationHook;
				} else if (head.parentNode && head.parentNode._tagMetaBlockAssociationName === "Systems") {
					head._tagMetaBlockAssociationName = "Systems";
					head._tagMetaBlockAssociationHook = head.parentNode._tagMetaBlockAssociationHook;
				} else if (head.parentNode && head.parentNode._tagMetaBlockAssociationName === "Parts") {
					head._tagMetaBlockAssociationName = "Parts";
					head._tagMetaBlockAssociationHook = head.parentNode._tagMetaBlockAssociationHook;
				} else if (head.parentNode && head.parentNode._tagMetaBlockAssociationName === "Results") {
					head._tagMetaBlockAssociationName = "Results";
					head._tagMetaBlockAssociationHook = head.parentNode._tagMetaBlockAssociationHook;
				}
				return {
					lPos: head._tagLineStart,
					lDepth: lastDepth
				};
			}
			// parent node
			else if (head.children && head.children.length > 0) {
				// MISSING: _tagLineEnd
				head._tagLineStart = lastPos + 1;
				head._tagDepth = lastDepth + 1;
				head._tagClass = "parent";
				// identify Measurement block
				if (head.tagName === "Measurement" && head.parentNode.parentNode === null) {
					head._tagMetaBlockAssociationName = "Measurement";
					head._tagMetaBlockAssociationHook = head;

					// set hooks to components if available
					for (var k = 0; k < head.children.length; ++k) {
						switch (head.children[k].tagName) {
						case "Header":
							head._tagMeasurementHeaderHook = head.children[k];
							break;
						case "Systems":
							head._tagMeasurementSystemsHook = head.children[k];
							break;
						case "Parts":
							head._tagMeasurementPartsHook = head.children[k];
							break;
						case "Results":
							head._tagMeasurementResultsHook = head.children[k];
							break;
						}
					}
				} else if (head.parentNode && head.parentNode._tagMetaBlockAssociationName === "Measurement" && head.tagName === "Header") {
					head._tagMetaBlockAssociationName = "Header";
					head._tagMetaBlockAssociationHook = head;
				} else if (head.parentNode && head.parentNode._tagMetaBlockAssociationName === "Measurement" && head.tagName === "Systems") {
					head._tagMetaBlockAssociationName = "Systems";
					head._tagMetaBlockAssociationHook = head;
				} else if (head.parentNode && head.parentNode._tagMetaBlockAssociationName === "Measurement" && head.tagName === "Parts") {
					head._tagMetaBlockAssociationName = "Parts";
					head._tagMetaBlockAssociationHook = head;
				} else if (head.parentNode && head.parentNode._tagMetaBlockAssociationName === "Measurement" && head.tagName === "Results") {
					head._tagMetaBlockAssociationName = "Results";
					head._tagMetaBlockAssociationHook = head;
				} else if (head.parentNode && head.parentNode._tagMetaBlockAssociationName === "Header") {
					head._tagMetaBlockAssociationName = "Header";
					head._tagMetaBlockAssociationHook = head.parentNode._tagMetaBlockAssociationHook;
				} else if (head.parentNode && head.parentNode._tagMetaBlockAssociationName === "Systems") {
					head._tagMetaBlockAssociationName = "Systems";
					head._tagMetaBlockAssociationHook = head.parentNode._tagMetaBlockAssociationHook;
				} else if (head.parentNode && head.parentNode._tagMetaBlockAssociationName === "Parts") {
					head._tagMetaBlockAssociationName = "Parts";
					head._tagMetaBlockAssociationHook = head.parentNode._tagMetaBlockAssociationHook;
				} else if (head.parentNode && head.parentNode._tagMetaBlockAssociationName === "Results") {
					head._tagMetaBlockAssociationName = "Results";
					head._tagMetaBlockAssociationHook = head.parentNode._tagMetaBlockAssociationHook;
				} else {
					head._tagMetaBlockAssociationName = "invalid";
				}

				// initial values
				var _oCallValues = {};
				_oCallValues.lPos = head._tagLineStart;
				_oCallValues.lDepth = head._tagDepth;

				// call all children
				for (var i = 0; i < head.children.length; ++i) {
					_oCallValues = this._processXMLElement(head.children[i], _oCallValues.lPos, _oCallValues.lDepth);
				}

				// increase line position and ajdust its value in _oCallValues
				_oCallValues.lPos++;
				_oCallValues.lDepth = lastDepth;

				return _oCallValues;
			}
		}
	});
});