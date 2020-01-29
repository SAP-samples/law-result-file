sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/UIComponent",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast",
	"sap/base/Log",
	"../model/formatter"
], function (Controller, UIComponent, JSONModel, MessageToast, Log, formatter) {
	"use strict";

	var _oBundle; // holds the resource bundle for text translation
	// var _blockSelector; // holds the dropdown box
	var _translatableTexts;	// holds the set of texts where either 'tag' should  match a tag or a provided text should start with 'innerHTML', or both.
	var _i18nBundle; // holds the resource bundle for text translation

	return Controller.extend("sap.support.zglacelx.controller.BaseController", {
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
			return this.buildEditorContextSized(node, oCodeEditor, true);
		},
			
		buildEditorContextSized: function (node, oCodeEditor, setSize) {
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

			this.buildEditorSized(_sXMAS, oCodeEditor, node._tagLineStart, setSize);
		},

		buildEditor: function (codeStr, oCodeEditor, firstLineNumber) {
			return this.buildEditorSized(codeStr, oCodeEditor, firstLineNumber, true);
		},
			
		buildEditorSized: function (codeStr, oCodeEditor, firstLineNumber, setSize) {	
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
			if (setSize) {            	
				oCodeEditor._oEditor.setOptions({
					firstLineNumber: firstLineNumber, maxLines: 100000000
				});
			} else {
				oCodeEditor._oEditor.setOptions({ 
                firstLineNumber: firstLineNumber, minLines: 5,
                scrollPastEnd: 0.5 });
			}
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
		},

		_getCodeSelector: function(oBlockSelector) { 		// _mainModelRaw = this._oModel.getData().children[0];
			_oBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
			var _mainModelRaw = this._oModel.getData().children[0];
			
			try {
				if (oBlockSelector != null && oBlockSelector.getItems() != null && oBlockSelector.getItems().length > 0) {									
					return oBlockSelector;
				}
			} catch (err) {
				// not properly initialized, will be done now
			}

			// oBlockSelector = new sap.m.Select("blockSelector");
			oBlockSelector.setShowSecondaryValues(true);
			
			var nextItem, mainText, addText, i;

			/* xml.dropdown.header.text=Header
			xml.dropdown.system.text=System {0}
			xml.dropdown.part.text=Part {0}
			xml.dropdown.result.text=Result {0}
			xml.dropdown.line.text=Line {0} */

			// build Header entry
			mainText = jQuery.sap.formatMessage(_oBundle.getText("xml.dropdown.line.text"), _mainModelRaw._tagMeasurementHeaderHook._tagLineStart);
			addText = _oBundle.getText("xml.dropdown.header.text");
			nextItem = new sap.ui.core.ListItem( { key: "header", text: mainText, additionalText: addText } );
			oBlockSelector.addItem(nextItem);

			// build System entries
			for (i = 0; i < _mainModelRaw._tagMeasurementSystemsHook.childElementCount; i++) {
				mainText = jQuery.sap.formatMessage(_oBundle.getText("xml.dropdown.line.text"), _mainModelRaw._tagMeasurementSystemsHook.children[i]._tagLineStart);
				addText = jQuery.sap.formatMessage(_oBundle.getText("xml.dropdown.system.text"), i);
				nextItem = new sap.ui.core.ListItem( { key: "system/" + i, text: mainText, additionalText: addText } );
				oBlockSelector.addItem(nextItem);
			}
			
			// build Part entries
			for (i = 0; i < _mainModelRaw._tagMeasurementPartsHook.childElementCount; i++) {
				mainText = jQuery.sap.formatMessage(_oBundle.getText("xml.dropdown.line.text"), _mainModelRaw._tagMeasurementPartsHook.children[i]._tagLineStart);
				addText = jQuery.sap.formatMessage(_oBundle.getText("xml.dropdown.part.text"), i);
				nextItem = new sap.ui.core.ListItem( { key: "part/" + i, text: mainText, additionalText: addText } );
				oBlockSelector.addItem(nextItem);
			}
			
			// build result entries
			for (i = 0; i < _mainModelRaw._tagMeasurementResultsHook.childElementCount; i++) {
				mainText = jQuery.sap.formatMessage(_oBundle.getText("xml.dropdown.line.text"), _mainModelRaw._tagMeasurementResultsHook.children[i]._tagLineStart);
				addText = jQuery.sap.formatMessage(_oBundle.getText("xml.dropdown.result.text"), i);
				nextItem = new sap.ui.core.ListItem( { key: "resultid/" + i, text: mainText, additionalText: addText } );
				oBlockSelector.addItem(nextItem);
			}
			return oBlockSelector;

		},

		 /* returns a title for a given combination of an engine and a metric number. Accepts 
			engine with leading 0 or ENG(C/S/*) and metric with leading 0 or "UNT" 
		 // File format:	"unitsList": [
								{ "engine": "100",    "units": [ 
            						{ "unit": "50", "unitName": "PA Master Records" }, 
		 */ 	
		//								GenericId	USRC0000000006	true					USRC or ENGC or null
		_getTagTranslation: function (	tag,		innerHtml,		getMulti,	count,		context) {
			_translatableTexts = this.getOwnerComponent().getModel("trans").getData().trans;

			// is there a translation for the tag?
			var i;
			var displayText, start, len;
			var transEntry, transTag, transTxt;
			if (tag && tag !== "") {
				if (_translatableTexts && _translatableTexts.length > 0) {
					for (i = 0; i < _translatableTexts.length; i++) {
						transEntry = _translatableTexts[i];
						transTag = transEntry.tag;
						transTxt = transEntry.innerHTML;
						if (transTag && transTag !== "") {
							if ((tag === "Attribute2" || tag === "ATTRIBUTE2") && (!context || context === "")) {
								// debugger;
							}
							if (tag.toUpperCase().startsWith(transTag.toUpperCase())) {
								// If multiple uiTexts exist, find the proper one: by using the firstTagHtml value
								if (transEntry.uiText && typeof transEntry.uiText !== "string") {
									if (transEntry.uiText.length > 0) {
										for (var k=0; k < transEntry.uiText.length; k++) {
											if ( (typeof transEntry.uiText[k].context === 'string' && typeof transEntry.uiText[k].uiText === 'string' && 
													transEntry.uiText[k].context.startsWith(context))
												|| (!context &&  !transEntry.uiText[k].context)) 
											{
												if (getMulti && transEntry.uiText[k].uiTextMulti) {
													displayText = transEntry.uiText[k].uiTextMulti;
												} else {
													displayText = transEntry.uiText[k].uiText;
												}
												displayText = this._translate(displayText);
												// format (replace {0} placeholders with numbers)
												displayText = this._formatTranslation(displayText,	count);
												return displayText;
											} 
										}
										if (!displayText) {
											// no translation found
											// displayText = tag;
											// debugger;
										}
									} else {
										// no translation found
										// displayText = tag;
										// debugger;
									}
									break; 
								} else {
									// check if also the innerHTML must match
									if (transTxt && transTxt !== "") {
										if (innerHtml.toUpperCase().startsWith(transTxt.toUpperCase())) {
											if (getMulti) {
												displayText = transEntry.uiTextMulti;
											} else {
												displayText = transEntry.uiText;
											}
											displayText = this._translate(displayText);
				
											// format (replace {0} placeholders with numbers)
											if (transEntry.number && transEntry.number === "useHtml") {
												start = transTxt.length;
												len = innerHtml.length - start;
												displayText = this._formatTranslation(	displayText,		// e.g. "- Type {0}",
																				innerHtml.substr(start, len)
																			);
											} else if (transEntry.number && transEntry.number === "formatTime") {
												count = formatter.formatTime(count);
												displayText = this._formatTranslation(
													displayText,
													count);
											}
											return displayText;
										}
									} else {
										if (getMulti && transEntry.uiTextMulti) {
											displayText = transEntry.uiTextMulti;
										} else {
											displayText = transEntry.uiText;
										}
										displayText = this._translate(displayText);
										displayText = this._formatTranslation(displayText,	count);
										return displayText;
									}
								}
							} // else: nothing to do, for next will try next translation tag
						} else { 
							// no tag provided, so an innerHTML is expected to match
							transTxt = transEntry.innerHTML;
							if (transTxt && transTxt !== "") {
								if (innerHtml.toUpperCase().startsWith(transTxt.toUpperCase())) {
									if (getMulti) {
										displayText = transEntry.uiTextMulti;
									} else {
										displayText = transEntry.uiText;
									}
									displayText = this._translate(displayText);
		
									// format (replace {0} placeholders with numbers)
									if (transEntry.number && transEntry.number === "useHtml") {
										start = transTxt.length;
										len = innerHtml.length - start;
										displayText = this._formatTranslation(	displayText,		// e.g. "- Type {0}",
																		innerHtml.substr(start, len)
																	);
									}
									return displayText;
								}
							} else {
								// debugger;
								// console.log("Entry in tagsTranslations.json file with neither 'tag' nor 'innerHTML' entry");
							}
						} 
					} // else: no translation found, try innerHTML part
				} else {
					return this._translate("i18n>all.unspecified.text");
				}
			} 
			return this._translate("i18n>all.unspecified.text");
		},

		_translate: function (text) {
			_i18nBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();

			if (!text) { 
				return _i18nBundle.getText("all.unspecified.text"); // =[unspecified]
			}
			if (text.startsWith("i18n>")) {
				text = text.substr(5, text.length);
				var translation = _i18nBundle.getText(text);
				if (translation) {
					return translation;
				} else {
					return "[!" + text + "]";
				}
			} else {
				// the text might already be translated, e.g. in the tagsTranslation.json file
				// do NOT REMOVE this part, unless you replace all translations in the tagsTranslation.json with i18n> bundles
				return text;
			}
		},

		_formatTranslation: function (text, firstNumStr, secondNumStr, thirdNumStr) {
			var newText = jQuery.sap.formatMessage(text, firstNumStr, secondNumStr, thirdNumStr);
			return newText;
		}
	});
});