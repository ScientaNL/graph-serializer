# graph-serializer

Graph serializer is a lightweight ibrary for converting JSON data structures to typed objects usable in typescript. Benefits include better type checking in your IDE, better type safety, and standardized date conversion. Primary use case is for easy integration of RESTful services and typescript.

## Installation

Add graph-serializer to your dependencies:
```shell
npm i --save @syslogic/graph-serializer
```

## Usage

Graph-serializer provides an annotation which you can use in your typescrpt entities. You can use the `@serializable` to specify which properties need to be (de)serialized.

The `serialize` and `deserialize` functions can then be used with the entity

### Basic usage

```typescript
import {serializable,deserialize,serialize} from "@syslogic/graph-serializer"

class Foo {
    @serializable()
    public thisWillBeSerialized: string = 'test';
}

let fooObj = deserialize(Foo, {thisWillBeSerialized: 'bar'}); // fooOjb instanceof Foo === true
let fooGraph = serialize(new Foo()); //  fooGraph = {thisWillBeSerialized: 'bar'}
```

### Advanced

There are a few serializer parameters to seraialize all sorts of serializers. Check the [test directory](tests/) for more examples. Features include:

 - Proper `Date` deserialization
 - Nested serialization
 - Serialize and deserialize including subclasses (class hierarcy)
 - Arrays, multilevel arrays
 - Union types
 - Polymorphic arrays
