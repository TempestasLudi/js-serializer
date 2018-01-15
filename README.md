# JsSerializer
With JsSerializer you can create javascript objects from XML data and vice versa.

## Example
In order to have the interchanging happen in an orderly fashion, you have to provide a so-called template, to let the serializer know what should be called what, which constructors should be used etc.
For example, of you want to turn
```javascript
{a: 15, b: true, c: [3, 5]}
```
into
```XML
<x>
  <a>15</a>
  <b>true</b>
  <c>
    <number>3</number>
    <number>5</number>
   </c>
</x>
```
and vice versa, you do the following:
```javascript
let template = new Serializer.Object({
  a: new Serializer.Number(),
  b: new Serializer.Boolean(),
  c: new Serializer.Array("number", new Serializer.Number())
});
let data = {a: 15, b: true, c: [3, 5]};
let xmlData = template.fromJs(data).toXmlString("x"); // Turn javascript into XML
let originalData = template.fromXmlString(xmlData).toJs(); // Turn XML into javascript
console.log(xmlData);
console.log(originalData);
```

## Documentation
To make this work, you have to import the file `serializer.js`.

### Template types
The following template types are available:

#### Object template
Parameter:
 - the properties' templates
 - the constructor of this object, only used for interchanging to javascript (default: Object)
```javascript
new Serializer.Object(properties, constructor);
```
#### Array template
Parameters:
 - the array items' names
 - the array items' template
```javascript
new Serializer.Array(name, template);
```

#### Value templates
These templates have no parameters.
```javascript
new Serializer.Boolean();
new Serializer.Integer();
new Serializer.Number();
new Serializer.String();
```

### Interchanging data
With a template, you can create an intermediate object structure from either javascript or XML. You can then use this structure to create XML or javascript again. Given certain javascript data `jsData`, XML node `xmlData` and their template `template`, the following functions can be called, which all give the same intermediate object:
```javascript
template.fromJs(jsData);
template.fromXml(xmlData);
template.fromXmlString(xmlData.outerHTML);
```
When such an intermediate object `data` has been obtained, it can be turned into its XML or javascript representation as follows:
```javascript
data.toJs();
data.toXml(name);
data.toXmlString(name);
```
The XML methods have a `name` parameter, which is the tagname that the data object itself will have in its XML representation.

#### Javascript constructors
It is possible to pass a javascript constructor to an Object template. For example:
```javascript
class P {}
class Q {}

let data = "<p><a>3</a><b><c>fifteen</c></b></p>";

let template = new Serializer.Object({
  a: new Serializer.Number(),
  b: new Serializer.Object({
    c: new Serializer.String()
  }, Q)
}, P);

console.log(template.fromXmlString(data).toJs()); // P {a: 3, b: Q {c: "fifteen"}}
```
The constructors that have been passed are called without arguments and after that, the values are set one by one.
