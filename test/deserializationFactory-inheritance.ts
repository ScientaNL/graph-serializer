import {expect} from 'chai';
import {deserializationFactory, deserialize, serializable, serialize} from "../src/graph-serializer";

/**
 * Testing inheritance. Inheritance adds some complexity to the serializer; we need to serialize super classes as well.
 */

describe('DeserializationFactory Inheritance', () => {

	abstract class BaseClass {
		@serializable()
		propertyOfBaseClass: string = 'base';

		@serializable()
		overriddenProperty: string = 'overridden Super';

		constructor(private id: number) {
			if(!id) {
				throw new Error("No id set");
			}
		}
	}

	class Implementation extends BaseClass {
		@serializable()
		propertyOfImplementationClass: string = 'derived';

		@serializable()
		overriddenProperty: string = 'overridden Derived';

		@deserializationFactory()
		public static factory(data: any) {
			return new Implementation(1);
		}
	}

	it('deserialize', () => {
		// If properties are not defined,
		let object = deserialize(Implementation, {});

		expect(object.propertyOfBaseClass).to.equal('base');
		expect(object.propertyOfImplementationClass).to.equal('derived');
		expect(object.overriddenProperty).to.equal('overridden Derived');
	});
});