import {expect} from 'chai';
import {array, deserialize, object, serializable, serialize} from "../src/graph-serializer";

describe('Arrays', () => {

	class Sub {
		@serializable()
		label: string = 'initial';
	}

	class TestArrays {
		@serializable({
			scheme: array()
		})
		emptyArray: any[] = [];

		@serializable({
			scheme: array()
		})
		stringArray: string[] = ['string 1', 'string 2', 'string 3'];

		@serializable({
			scheme: array(array())
		})
		multiLevel: any[][] = [
			['group a string 1', 1, 41],
			['group b string 1', null],
			[]
		];

		@serializable({
			scheme: array(object(Sub))
		})
		objectArray: Sub[] = [
			new Sub(),
			new Sub(),
		];
	}

	it('serialize', () => {
		let output = serialize(new TestArrays());
		expect(output.emptyArray).to.deep.equal([]);
		expect(output.emptyArray).to.not.equal([]);
		expect(output.stringArray).to.deep.equal(['string 1', 'string 2', 'string 3']);
		expect(output.stringArray).to.not.equal(['string 1', 'string 2', 'string 3']);
		expect(output.multiLevel).to.deep.equal([
			['group a string 1', 1, 41],
			['group b string 1', null],
			[]
		]);
		expect(output.multiLevel).to.not.equal([
			['group a string 1', 1, 41],
			['group b string 1', null],
			[]
		]);
		expect(output.objectArray[1].label).to.equal('initial');
	});

	it('deserialize', () => {
		let output = deserialize(TestArrays, {
			emptyArray: [],
			stringArray: ['string 1', 'string 2', 'string 3'],
			multiLevel: [
				['group a string 1', 1, 41],
				['group b string 1', null],
				[]
			]
		});
		expect(output.emptyArray).to.deep.equal([]);
		expect(output.emptyArray).to.not.equal([]);
		expect(output.stringArray).to.deep.equal(['string 1', 'string 2', 'string 3']);
		expect(output.stringArray).to.not.equal(['string 1', 'string 2', 'string 3']);
		expect(output.multiLevel).to.deep.equal([
			['group a string 1', 1, 41],
			['group b string 1', null],
			[]
		]);
		expect(output.multiLevel).to.not.equal([
			['group a string 1', 1, 41],
			['group b string 1', null],
			[]
		]);

		expect(output.stringArray).to.not.deep.equal(['replaced 1', 'string 2', 'string 3']);
	});

	it('when deserializing, undefined properties in src should be kept at class default', () => {
		// When
		class Foo {
			@serializable({scheme: array()}) names: string[] = [];
			@serializable({scheme: array()}) directions: string[] = ['up', 'down', 'left', 'right'];
		}

		let output = deserialize(Foo, {});
		expect(output.names).to.deep.equal([]);
		expect(output.directions).to.deep.equal(['up', 'down', 'left', 'right']);
	});
});
