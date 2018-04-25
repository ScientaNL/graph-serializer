import {expect} from 'chai';
import {array, custom, date, deserialize, object, serializable, serialize} from "../src/graph-serializer";

/** @todo find a strategy to handle any of the standard objects, such as defined in
 * https://developer.mozilla.org/nl/docs/Web/JavaScript/Reference/Global_Objects
 * and
 * https://developer.mozilla.org/en-US/docs/Web/API
 */

describe('Extra tests', () => {

    describe('null value in nested class', () => {

        class Foo {
            @serializable() name:string;
        }
        class Bar {
            @serializable() name:string;
            @serializable() nest:Foo;
        }

        it('deserialize', () => {

            let output = deserialize(Bar,{
                name: "bar",
                nest: {
                    name: "foo"
                }
            });
            expect(output).to.be.instanceOf(Bar);
            expect(output.nest.name).to.equal('foo');

            output = deserialize(Bar,{
                name: "bar",
                nest: null
            });
            expect(output.nest).to.equal(null);

        });
    });

    describe('null object value class', () => {
        // Test for use case. If decorated object property is null, it should be deserialized as such
        class Foo {
            @serializable() fooName: string;
        }
        class Bar {
            @serializable({scheme: object(Foo)}) foo: Foo;
        }
        it('deserialize', () => {
            let output = deserialize(Bar,{
                name: 'bar',
                foo: null,
            })
            expect(output.foo).to.equal(null);
        });
    });

    describe('null object value in decorator-less class', () => {

        class Foo {
            foo: string;
        }
        class Bar {
            @serializable({scheme: object(Foo)}) foo: Foo;
        }
        it('deserialize', () => {
            let output = deserialize(Bar,{
                name: 'bar',
                foo: null,
            });
            expect(output.foo).to.equal(null);
        });
    });


});

