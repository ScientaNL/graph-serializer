import {expect} from 'chai';
import {deserialize, object, serializable, serialize} from "../src/graph-serializer";

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
