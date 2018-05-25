import {expect} from 'chai';
import {deserialize, postDeserialize, serializable} from "../src/graph-serializer";

/**
 * postDeserialize test file
 */

describe('postDeserialize', () => {

    class TestClass {
        @postDeserialize()
        public static callAfterDeserialize(input: TestClass) {
            input.postDeserializeCalled = true;
        }

        @serializable() public label = '';
        public testBoolean = false;
        public postDeserializeCalled = false;
    }

    it('deserialize', () => {
        const output = deserialize(TestClass,{
            label: 'test deserialize'
        });
        expect(output.label).to.equal('test deserialize');
        expect(output.testBoolean).to.equal(false);
        expect(output.postDeserializeCalled).to.equal(true);
    });

});
