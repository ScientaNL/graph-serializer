import {expect} from 'chai';
import {deserialize, serializable, serialize} from "../src/graph-serializer";

/**
 * Testing inheritance. Inheritance adds some complexity to the serializer; we need to serialize super classes as well.
 */

describe('Inheritance', () => {

	class SuperClass {
		@serializable()
		superProperty: string = 'super';

		@serializable()
		overriddenProperty: string = 'overridden Super';
	}

	class DerivedClass extends SuperClass {
		@serializable()
		derivedProperty: string = 'derived';
		@serializable()
		overriddenProperty: string = 'overridden Derived';
	}

	it('serialize', () => {
		let output = serialize(new DerivedClass);
		expect(output).to.deep.equal({
			superProperty: 'super',
			derivedProperty: 'derived',
			overriddenProperty: 'overridden Derived'
		});
	});

	it('deserialize', () => {
		// If properties are not defined,
		let output = deserialize(DerivedClass, {});
		expect(output.superProperty).to.equal('super');
		expect(output.derivedProperty).to.equal('derived');
		expect(output.overriddenProperty).to.equal('overridden Super');
	});

	it('combine', () => {
		let output = deserialize(SuperClass, serialize(new DerivedClass()));
		expect(output.superProperty).to.equal('super');
		expect(output.overriddenProperty).to.equal('overridden Derived');
		expect(output.derivedProperty).to.equal(undefined);
	});

	it('serialize 2', () => {
		class Foo {
			@serializable()
			name: string;
		}

		class Bar extends Foo {
			@serializable()
			label: string;
		}

		let v = new Bar();
		v.name = 'foo';
		v.label = 'bar';

		expect(serialize(v)).to.deep.equal({name: 'foo', label: 'bar'});
	});

});