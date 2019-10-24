import {expect} from 'chai';
import {array, custom, date, deserialize, object, objectMap, serializable, serialize} from "../src/graph-serializer";


describe('ObjectMaps', () => {

	class Sub {
		@serializable()
		label: string = 'initial';
	}

	class TestObjectMaps {
		@serializable({
			scheme: objectMap()
		})
		emptyMap: Record<string, string> = {};

		@serializable({
			scheme: objectMap()
		})
		stringMap: Record<string, string> = {'a': 'a', 'b': 'b', 'c': 'c'};

		@serializable({
			scheme: objectMap(objectMap())
		})
		multiLevel: Record<string, Record<string, string>> = {
			'a': {'a1': 'a1', 'a2': 'a2', 'a3': 'a3'},
			'b': {'b1': 'b1', 'b2': 'b2', 'b3': 'b3'},
			'c': {'c1': 'c1', 'c2': 'c2', 'c3': 'c3'},
		};

		@serializable({
			scheme: objectMap(object(Sub))
		})
		objectMap: Record<string, Sub> = {
			'a': new Sub(),
			'b': new Sub(),
			'c': new Sub(),
		};
	}

	it('serialize', () => {
		let output = serialize(new TestObjectMaps());
		expect(output.emptyMap).to.deep.equal({});
		expect(output.stringMap).to.deep.equal({'a': 'a', 'b': 'b', 'c': 'c'});
		expect(output.multiLevel).to.deep.equal({
			'a': {'a1': 'a1', 'a2': 'a2', 'a3': 'a3'},
			'b': {'b1': 'b1', 'b2': 'b2', 'b3': 'b3'},
			'c': {'c1': 'c1', 'c2': 'c2', 'c3': 'c3'},
		});
		expect(output.objectMap['a'].label).to.equal('initial');
	});

	it('deserialize', () => {
		let output: TestObjectMaps = deserialize(TestObjectMaps, {
			emptyMap: {},
			stringMap: {'a': 'a', 'b': 'b', 'c': 'c'},
			multiLevel: {
				'a': {'a1': 'a1', 'a2': 'a2', 'a3': 'a3'},
				'b': {'b1': 'b1', 'b2': 'b2', 'b3': 'b3'},
				'c': {'c1': 'c1', 'c2': 'c2', 'c3': 'c3'},
			},
			objectMap: {
				'a': {'label': 'initial'},
				'b': {'label': 'initial'},
				'c': {'label': 'initial'}
			}
		});

		expect(output.emptyMap).to.deep.equal({});
		expect(output.stringMap).to.deep.equal({'a': 'a', 'b': 'b', 'c': 'c'});
		expect(output.multiLevel).to.deep.equal({
			'a': {'a1': 'a1', 'a2': 'a2', 'a3': 'a3'},
			'b': {'b1': 'b1', 'b2': 'b2', 'b3': 'b3'},
			'c': {'c1': 'c1', 'c2': 'c2', 'c3': 'c3'},
		});

		expect(output.objectMap.a).to.instanceOf(Sub);
		expect(output.objectMap.a.label).to.equal("initial");
	});

	it('when deserializing, undefined properties in src should be kept at class default', () => {
		// When
		class Foo {
			@serializable({scheme: objectMap()}) test1: Record<string, string> = {};
			@serializable({scheme: objectMap()}) test2: Record<string, string> = {'a': 'a', 'b': 'b'};
		}

		let output = deserialize(Foo, {});

		expect(output.test1).to.deep.equal({});
		expect(output.test2).to.deep.equal({'a': 'a', 'b': 'b'});
	});
});
