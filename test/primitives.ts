import {expect} from 'chai';
import {deserialize, serializable, serialize} from "../src/graph-serializer";

/**
 * @todo
 *
 * Find a strategy to handle any of the standard objects, such as defined in
 * https://developer.mozilla.org/nl/docs/Web/JavaScript/Reference/Global_Objects
 * and https://developer.mozilla.org/en-US/docs/Web/API
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
