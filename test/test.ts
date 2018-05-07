import {expect} from 'chai';
import {array, custom, date, deserialize, object, serializable, serialize} from "../src/graph-serializer";

/** @todo find a strategy to handle any of the standard objects, such as defined in
 * https://developer.mozilla.org/nl/docs/Web/JavaScript/Reference/Global_Objects
 * and
 * https://developer.mozilla.org/en-US/docs/Web/API
 */

describe('Primitives', () => {

	describe('Boolean', () => {

		@serializable()
		class TestBoolean {
			@serializable()
			isUndefined: boolean;

			@serializable()
			isTrue: boolean = true;

			@serializable()
			isFalse: boolean = false;

			@serializable()
			isNull: boolean = null;

			@serializable()
			isBooleanUndefined: Boolean;

			@serializable()
			isBooleanTrue: Boolean = true;

			@serializable()
			isBooleanFalse: Boolean = false;

			@serializable()
			isBooleanNull: Boolean = null;
		}

		it('serialize', () => {
			let input = new TestBoolean();
			let output = serialize(input);
			expect(output.isUndefined).to.equal(undefined);
			expect(output.isTrue).to.equal(true);
			expect(output.isFalse).to.equal(false);
			expect(output.isNull).to.equal(null);
			expect(output.isBooleanUndefined).to.equal(undefined);
			expect(output.isBooleanTrue).to.equal(true);
			expect(output.isBooleanFalse).to.equal(false);
			expect(output.isBooleanNull).to.equal(null);
		});

		it('deserialize', () => {
			let output = deserialize(TestBoolean, {
				isTrue: true,
				isFalse: false,
				isNull: null,
				isBooleanTrue: true,
				isBooleanFalse: false,
				isBooleanNull: null
			});
			expect(output.isUndefined).to.equal(undefined);
			expect(output.isTrue).to.equal(true);
			expect(output.isFalse).to.equal(false);
			expect(output.isNull).to.equal(null);
			expect(output.isBooleanUndefined).to.equal(undefined);
			expect(output.isBooleanTrue).to.equal(true);
			expect(output.isBooleanFalse).to.equal(false);
			expect(output.isBooleanNull).to.equal(null);
		});
	});

	describe('Number', () => {

		class TestNumber {
			@serializable()
			isUndefined: number;

			@serializable()
			simple: number = 12;

			@serializable()
			negative: number = -9;

			@serializable()
			float: number = 3.14;

			@serializable()
			floatNumberNull: Number = null;

			@serializable()
			floatNumberNegative: Number = -21.2;
		}

		it('serialize', () => {
			let output = serialize(new TestNumber());
			expect(output.isUndefined).to.equal(undefined);
			expect(output.simple).to.equal(12);
			expect(output.negative).to.equal(-9);
			expect(output.float).to.equal(3.14);
			expect(output.floatNumberNull).to.equal(null);
			expect(output.floatNumberNegative).to.equal(-21.2);
		});

		it('deserialize', () => {
			let output = deserialize(TestNumber, {
				simple: 13,
				negative: -8,
				float: 4.14,
				floatNumberNull: null,
				floatNumberNegative: -20.2
			});
			expect(output.isUndefined).to.equal(undefined);
			expect(output.simple).to.equal(13);
			expect(output.negative).to.equal(-8);
			expect(output.float).to.equal(4.14);
			expect(output.floatNumberNull).to.equal(null);
			expect(output.floatNumberNegative).to.equal(-20.2);
		});
	});

	describe('String', () => {

		class TestString {
			@serializable()
			isUndefined: string;

			@serializable()
			isNull: string = null;

			@serializable()
			empty: string = "";

			@serializable()
			filled: string = "Example string";

			@serializable()
			filledString: String = String("Example string 2");

		}

		it('serialize', () => {
			let output = serialize(new TestString());
			expect(output.isUndefined).to.equal(undefined);
			expect(output.isNull).to.equal(null);
			expect(output.empty).to.equal("");
			expect(output.filled).to.equal("Example string");
			expect(output.filledString).to.equal("Example string 2");
		});

		it('deserialize', () => {
			let output = deserialize(TestString, {
				isNull: null,
				empty: "",
				filled: "Example string",
				filledString: "Example string 2"
			});
			expect(output.isUndefined).to.equal(undefined);
			expect(output.isNull).to.equal(null);
			expect(output.empty).to.equal("");
			expect(output.filled).to.equal("Example string");
			expect(output.filledString).to.equal("Example string 2");
		});
	});

	/** @todo Should we do something with symbol primitives? */

});

describe('Nesting', () => {

	class Sub {
		@serializable()
		label: string = 'initial';
	}

	class TestNesting {
		@serializable({
			scheme: object(Sub)
		})
		sub: Sub = Object.assign(new Sub(), {
			label: 'testNesting'
		});
	}

	it('serialize', () => {
		let output = serialize(new TestNesting());
		expect(output.sub.label).to.equal('testNesting');
	});

	it('deserialize', () => {
		let output = deserialize(TestNesting, {
			sub: {
				label: 'Overridden'
			}
		});
		expect(output).to.be.instanceOf(TestNesting);
		expect(output.sub).to.be.instanceOf(Sub);
		expect(output.sub.label).to.equal('Overridden');
	});

});

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

describe('Dates', () => {

	class TestDate {
		@serializable({scheme: date})
		undefinedDate: Date;

		@serializable({scheme: date})
		nullDate: Date = null;

		@serializable({scheme: date})
		utcDate: Date = new Date('1982-02-07T09:15:03.123Z');

		// Same date but in Europe/Amsterdam timezone
		@serializable({scheme: date})
		w3cDate: Date = new Date('1982-02-07T10:15:03.123+01:00');
	}

	it('sane', () => {
		let output = new TestDate();
		expect(output.utcDate.getTime()).to.equal(output.w3cDate.getTime());
	});

	it('serialize', () => {
		let output = serialize(new TestDate());
		expect(output.undefinedDate).to.equal(undefined);
		expect(output.nullDate).to.equal(null);
		expect(output.utcDate).to.equal('1982-02-07T09:15:03.123Z');
		expect(output.w3cDate).to.equal('1982-02-07T09:15:03.123Z');
		expect(output.utcDate).to.equal(output.w3cDate); // <-- sanity check
	});

	it('deserialize', () => {
		let output = deserialize(TestDate, {
			nullDate: null,
			utcDate: '2018-01-01T09:15:03.123Z',
			w3cDate: '2018-01-01T09:15:03.123+00:00'
		});
		expect(output).to.be.instanceOf(TestDate);
		expect(output.utcDate).to.be.instanceOf(Date);
		expect(output.undefinedDate).to.equal(undefined);
		expect(output.nullDate).to.equal(null);
		expect(output.utcDate.toJSON()).to.equal('2018-01-01T09:15:03.123Z');
		expect(output.w3cDate.toJSON()).to.equal('2018-01-01T09:15:03.123Z');
		expect(output.utcDate.getTime()).to.equal(output.w3cDate.getTime()); // <-- sanity check
	});

});

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
