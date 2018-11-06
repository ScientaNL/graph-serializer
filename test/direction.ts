import {expect} from 'chai';
import {deserializationFactory, deserialize, serializable, serialize} from "../src/graph-serializer";

/**
 * direction test file
 */
describe('direction', () => {

	class TestClass {

		@serializable({
			direction: ["serialize"]
		})
		public serializationOnly: string = "serializationOnly";

		@serializable({
			direction: ["deserialize"]
		})
		public deserializationOnly: string  = "deserializationOnly";

		@serializable({
			direction: ["serialize", "deserialize"]
		})
		public explicitDirection: string  = "explicitDirection";

		@serializable()
		public implicitDirection: string = "implicitDirection";


	}

	it('deserialize', () => {
		const deserialized: TestClass = deserialize(TestClass, {
			serializationOnly: ("serializationOnly").toUpperCase(),
			deserializationOnly: ("deserializationOnly").toUpperCase(),
			explicitDirection: ("explicitDirection").toUpperCase(),
			implicitDirection: ("implicitDirection").toUpperCase(),
		});

		expect(deserialized).instanceOf(TestClass);
		expect(deserialized.serializationOnly).to.equal('serializationOnly');
		expect(deserialized.deserializationOnly).to.equal('DESERIALIZATIONONLY');
		expect(deserialized.explicitDirection).to.equal('EXPLICITDIRECTION');
		expect(deserialized.implicitDirection).to.equal('IMPLICITDIRECTION');
	});

	it('serialize', () => {
		const serialized = serialize(new TestClass());

		expect(serialized.serializationOnly).to.equal('serializationOnly');
		expect(serialized.deserializationOnly).to.undefined;
		expect(serialized.explicitDirection).to.equal('explicitDirection');
		expect(serialized.implicitDirection).to.equal('implicitDirection');
	});
});
