import {expect} from 'chai';
import {array, deserialize, serializable, serialize} from "../src/graph-serializer";

describe('serializeUntypedObjects', () => {
	it('serialize', () => {
		let x = {};
		expect(() => serialize(x)).to.not.throw();
	});

	it('Array handle undefined', () => {
		class Foo {
			@serializable({scheme: array()})
			names: string[]
		}

		expect(deserialize(Foo, {}).names).to.equal(undefined);
	});

	it('Array handle undefined (2)', () => {
		class Foo {
			@serializable({scheme: array()})
			names: Array<any>;
		}

		expect(deserialize(Foo, {names: undefined}).names).to.equal(undefined);
	});

	it('serialize basic object', () => {
		expect(serialize({name: 'test'})).to.deep.equal({name: 'test'});
	});
});
