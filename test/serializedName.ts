import {expect} from 'chai';
import {deserialize, serializable, serialize} from "../src/graph-serializer";

describe('serializedName', () => {

    class MyTest {

        @serializable({
            serializedName: 'value'
        })
        private internalValue: string = 'initial';

        public set value(v:string) {
            throw new Error('Setter should not be called by serializer');
        }
        public get value():string {
            throw new Error('Getter should not be called by serializer');
        }

        public getInternalValue():string {
            return this.internalValue;
        }
    }

    it('serialize', ()=>{
        const output = serialize(new MyTest());
        expect(output.value).to.equal('initial');
        expect(output.internalValue).to.equal(undefined);
    });

    it('deserialize', ()=>{
        const output = deserialize(MyTest,{
            value: 'initial',
            internalValue: 'annoy'
        });
        expect(output.getInternalValue()).to.equal('initial');
        expect(output.annoyingValue).to.equal(undefined);
    });

});
