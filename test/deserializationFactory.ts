import {expect} from 'chai';
import {deserializationFactory, deserialize, serializable, serialize} from "../src/graph-serializer";

/**
 * deserializationFactory test file
 */
describe('deserializationFactory', () => {

	class TestClass {

		@serializable({
			serializedName: 'label',
			direction: ["serialize"]
		})
		private labelProperty: string;

		constructor(labelProperty: string) {
			this.labelProperty = labelProperty;
		}

		public getLabel() {
			return this.labelProperty.toLowerCase();
		}

		@deserializationFactory()
		public static deserializationFactory(data: any) {
			return new TestClass(data['label'].toUpperCase());
		}
	}

	it('deserialize', () => {
		/**
		 * deserialize the data into an instance of TestClass.
		 * Internally the private label value is stored uppercase
		 * and is exposed through a getter and by serializing it.
		 */
		const output: TestClass = deserialize(TestClass, {
			label: 'test deserialize'
		});

		expect(output).instanceOf(TestClass);
		expect(output.getLabel()).to.equal('test deserialize');

		const reserialized = serialize(output);
		expect(reserialized.label).to.equal('TEST DESERIALIZE');
	});
});
