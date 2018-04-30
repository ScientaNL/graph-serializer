import {expect} from 'chai';
import {deserialize, serializable} from "../src/graph-serializer";

/**
 * postDeserialize test file
 */

describe('postDeserialize', () => {

    @serializable({
        postDeserialize: (input: TestClass) => input.postDeserializeCalled = true
    })
    class TestClass {
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
