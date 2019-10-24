import {expect} from 'chai';
import {array, custom, deserialize, serializable, serialize} from "../src/graph-serializer";

describe('Union types', () => {
	// Union types can be deserialized with a custom deserializer
	class SubA {
		@serializable()
		name: string = 'Sub A';
	}

	class SubB {
		@serializable()
		label: string = 'Sub B';
	}

	class TestUnions {
		@serializable({
			scheme: custom(
				(v: any) => serialize(v),
				(v: any) => v.hasOwnProperty('name') ? deserialize(SubA, v) : deserialize(SubB, v)
			)
		})
		subClass: SubA | SubB = new SubA();

		@serializable({
			scheme: array(custom(
				(v: any) => serialize(v),
				(v: any) => v.hasOwnProperty('name') ? deserialize(SubA, v) : deserialize(SubB, v)
			))
		})
		polymorphArray: (SubA | SubB)[] = [
			new SubA(),
			new SubA(),
			new SubB()
		];
	}

	it('deserialize', () => {
		let output = deserialize(TestUnions, {
			subClass: {
				label: 'SubB Label'
			},
			polymorphArray: [
				{label: 'SubB Label 2'},
				{name: 'SubA Name 1'},
				{name: 'SubA Name 2'},
			]
		});
		expect(output).to.be.an.instanceOf(TestUnions);
		expect(output.subClass).to.be.an.instanceOf(SubB);
		expect(output.polymorphArray[0]).to.be.an.instanceOf(SubB);
		expect(output.polymorphArray[1]).to.be.an.instanceOf(SubA);
		expect(output.polymorphArray[2]).to.be.an.instanceOf(SubA);

		expect(output.subClass.label).to.equal('SubB Label');
		expect(output.polymorphArray[0].label).to.equal('SubB Label 2');
		expect(output.polymorphArray[0].name).to.equal(undefined);
		expect(output.polymorphArray[1].name).to.equal('SubA Name 1');
		expect(output.polymorphArray[1].label).to.equal(undefined);
		expect(output.polymorphArray[2].name).to.equal('SubA Name 2');
		expect(output.polymorphArray[2].label).to.equal(undefined);
	});

	it('serialize', () => {
		let output = serialize(new TestUnions());
		expect(output).to.deep.equal({
			subClass: {
				name: 'Sub A'
			},
			polymorphArray: [
				{name: 'Sub A'},
				{name: 'Sub A'},
				{label: 'Sub B'},
			]
		});
	});

});
