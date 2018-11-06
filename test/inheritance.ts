import {expect} from 'chai';
import {deserialize, postDeserialize, serializable, serialize} from "../src/graph-serializer";

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
		expect(output.overriddenProperty).to.equal('overridden Derived');
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

describe('Inheritance stacking', () => {

	abstract class A {
		@serializable()
		superProperty: string = 'super';

		@serializable()
		overriddenProperty: string = 'setInBase';

		@serializable()
		propertyOfA: string;

		public willBeOverriddenByPostDeserialize: string = "defaultValue";
	}

	class B extends A {
		@serializable()
		derivedProperty: string = 'setInB';

		@serializable()
		overriddenProperty: string = 'setInB';

		@serializable()
		propertyOfB: string;

		constructor() {
			super();
		}

		@postDeserialize()
		public static postDeserialize(object: B) {
			object.willBeOverriddenByPostDeserialize = "setByPostDeserialize";
		}
	}

	class C extends B {
		@serializable()
		overriddenProperty: string = 'setInC';

		@serializable()
		propertyOfC: string;

		constructor() {
			super();
		}
	}

	class D extends C {
		@serializable()
		derivedProperty: string = 'setInD';
		@serializable()
		overriddenProperty: string = 'setInD';

		@serializable()
		propertyOfD: string;

		constructor() {
			super();
		}
	}

	it('deserialize', () => {
		// If properties are not defined,
		let output: D = deserialize(D, {
			'overriddenProperty': 'setThroughDeserialization',
			'propertyOfA': 'propertyOfA',
			'propertyOfB': 'propertyOfB',
			'propertyOfC': 'propertyOfC',
			'propertyOfD': 'propertyOfD'
		});

		expect(output.superProperty).to.equal('super');
		expect(output.derivedProperty).to.equal('setInD');
		expect(output.propertyOfA).to.equal('propertyOfA');
		expect(output.propertyOfB).to.equal('propertyOfB');
		expect(output.propertyOfC).to.equal('propertyOfC');
		expect(output.propertyOfD).to.equal('propertyOfD');
		expect(output.willBeOverriddenByPostDeserialize).to.equal('setByPostDeserialize');

	});
});