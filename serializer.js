/**
 * Copyright (C) 2018 Tempestas Ludi - All Rights Reserved
 * You may do anything you want with this code, even try to fry your microwave, as long as no applicable law prohibits it.
 * The only thing you may not do, is remove this copyright notice, or pretend that this is your own code.
 */

/**
 * The (exported) template constructors.
 *
 * @type {{Object, Array, Boolean, Integer, Number, String}}
 */
Serializer = (() => {
	/**
	 * The general template.
	 */
	class TType {
		constructor() {
		}

		/**
		 * Constructs a new intermediate object from a javascript object.
		 *
		 * @param value - the value to construct from
		 * @returns {DEntity} the constructed intermediate object
		 */
		fromJs(value) {
			return new DEntity(this);
		}

		/**
		 * Constructs a new intermediate object from an XML node.
		 *
		 * @param {Node} value - the node to construct from
		 * @returns {DEntity} the constructed intermediate object
		 */
		fromXml(value) {
			return new DEntity(this);
		}

		/**
		 * Constructs a new intermediate object from an XML string.
		 *
		 * @param {string} string - the string to construct from
		 * @returns {DEntity} the constructed intermediate object
		 */
		fromXmlString(string) {
			return this.fromXml(new DOMParser().parseFromString(string, "text/xml").childNodes[0]);
		}
	}

	/**
	 * The object template.
	 */
	class TObject extends TType {
		/**
		 * Creates a new object template.
		 *
		 * @param properties - the templates of the object's properties
		 * @param [objectType=Object] - the constructor of the type
		 */
		constructor(properties, objectType) {
			super();
			this.properties = properties;
			this.objectType = objectType || Object;
		}

		fromJs(value) {
			let properties = {};
			Object.keys(this.properties).forEach(name => properties[name] = this.properties[name].fromJs(value[name]));
			return new DObject(this, properties);
		}

		fromXml(value) {
			let properties = {};
			value.childNodes.forEach(node => {
				const name = node.tagName;
				if (!properties[name] && this.properties[name]) {
					properties[name] = this.properties[name].fromXml(node);
				}
			});
			return new DObject(this, properties);
		}
	}

	/**
	 * The array template.
	 */
	class TArray extends TType {
		/**
		 * Creates a new array template.
		 *
		 * @param {string} itemName - the name of the array items
		 * @param {TType} itemTemplate - the template of the array items
		 */
		constructor(itemName, itemTemplate) {
			super();
			this.item = {name: itemName, template: itemTemplate};
		}

		fromJs(value) {
			return new DArray(this, value.map(v => this.item.template.fromJs(v)));
		}

		fromXml(value) {
			return new DArray(
					this,
					Array.prototype.filter.call(value.childNodes, element => element.tagName === this.item.name)
							.map(element => this.item.template.fromXml(element))
			);
		}
	}

	/**
	 * The value template.
	 */
	class TValue extends TType {
		/**
		 * Creates a new value template.
		 *
		 * @param valueParser - the parser for values of this type
		 */
		constructor(valueParser) {
			super();
			this.valueParser = valueParser;
		}

		fromJs(value) {
			return new DValue(this, this.valueParser(value));
		}

		fromXml(value) {
			return new DValue(this, this.valueParser(value.textContent));
		}
	}

	/**
	 * The boolean template.
	 */
	class TBoolean extends TValue {
		/**
		 * Creates a new value template for booleans.
		 */
		constructor() {
			super(v => v === "true" || v === true || parseInt(v) === 1);
		}
	}

	/**
	 * The integer template.
	 */
	class TInteger extends TValue {
		/**
		 * Creates a new value template for integers.
		 */
		constructor() {
			super(parseInt);
		}
	}

	/**
	 * The number template.
	 */
	class TNumber extends TValue {
		/**
		 * Creates a new value template for numbers.
		 */
		constructor() {
			super(parseFloat);
		}
	}

	/**
	 * The string template.
	 */
	class TString extends TValue {
		/**
		 * Creates a new value template for strings.
		 */
		constructor() {
			super(v => v.toString());
		}
	}

	/**
	 * The general intermediate data object.
	 */
	class DEntity {
		/**
		 * Creates a new intermediate value object.
		 *
		 * @param {TType} template - the template of this object
		 */
		constructor(template) {
			this.template = template;
		}

		/**
		 * Turns this object's value into its javascript representation.
		 *
		 * @returns the javascript representation of this object's value
		 */
		toJs() {
			return null;
		}

		/**
		 * Turns this object's value into its XML representation.
		 *
		 * @param name - this object's name in the representation
		 * @param document - the document to create the representing elements with
		 * @returns {Element} the XML representation of this object's value
		 */
		toXml(name, document) {
			document = document || new Document();
			let element = document.createElement(name);
			element.textContent = "null";
			return element;
		}

		/**
		 * Turns this object's value into a string containing its XML representation.
		 *
		 * @param rootName - this object's name in the representation
		 * @returns {string} a string containing XML representing this object's value
		 */
		toXmlString(rootName) {
			let document = new Document();
			let rootElement = document.createElement("root");
			document.appendChild(rootElement);
			rootElement.appendChild(this.toXml(rootName, document));
			return rootElement.innerHTML;
		}
	}

	/**
	 * The object intermediate data object.
	 */
	class DObject extends DEntity {
		/**
		 * Creates a new object intermediate value.
		 *
		 * @param {TObject} template - the template of this object
		 * @param properties - the property values of this object
		 */
		constructor(template, properties) {
			super(template);
			this.properties = properties;
		}

		toJs() {
			let result = new this.template.objectType();
			Object.keys(this.properties).forEach(name => result[name] = this.properties[name].toJs());
			return result;
		}

		toXml(name, document) {
			document = document || new Document();
			let element = document.createElement(name);
			Object.keys(this.properties).forEach(name => element.appendChild(this.properties[name].toXml(name, document)));
			return element;
		}
	}

	/**
	 * The array intermediate data object.
	 */
	class DArray extends DEntity {
		/**
		 * Creates a new array intermediate value.
		 *
		 * @param {TArray} template - the template of this array
		 * @param {Array} items - the items of this array
		 */
		constructor(template, items) {
			super(template);
			this.items = items;
		}

		toJs() {
			return this.items.map(i => i.toJs());
		}

		toXml(name, document) {
			document = document || new Document();
			let element = document.createElement(name);
			this.items.forEach(item => element.appendChild(item.toXml(this.template.item.name, document)));
			return element;
		}
	}

	/**
	 * The (primitive) value intermediate data object.
	 */
	class DValue extends DEntity {
		/**
		 * Creates a new value intermediate.
		 *
		 * @param {TValue} template - the template of this value
		 * @param value - the value itself
		 */
		constructor(template, value) {
			super(template);
			this.value = value;
		}

		toJs() {
			return this.value;
		}

		toXml(name, document) {
			document = document || new Document();
			let element = document.createElement(name);
			element.textContent = this.value.toString();
			return element;
		}
	}

	/**
	 * The (exported) template constructors.
	 */
	return {
		Object: TObject,
		Array: TArray,
		Boolean: TBoolean,
		Integer: TInteger,
		Number: TNumber,
		String: TString
	};
})();
