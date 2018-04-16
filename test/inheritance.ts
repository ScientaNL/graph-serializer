import {serializable} from "../src/Decorators";
import {deserialize, serialize} from "../src/Serializer";
import {expect} from 'chai';

/**
 * Testing inheritance. Inheritance adds some complexity to the serializer; we need to serialize super classes as well.
 */

describe('Inheritance', () => {

    class SuperClass {
        @serializable()
        superProperty: string = 'super';

        @serializable()
        overriddenProperty: string = 'overridden Super';
    }

    class DerivedClass extends SuperClass {
        @serializable()
        derivedProperty: string = 'derived';
        @serializable()
        overriddenProperty: string = 'overridden Derived';
    }

    it('serialize', () => {
        let output = serialize(new DerivedClass);
        expect(output).to.deep.equal({
            superProperty: 'super',
            derivedProperty: 'derived',
            overriddenProperty: 'overridden Derived'
        });
    });

    it('deserialize', () => {
        let output = deserialize(DerivedClass,{});
        expect(output.superProperty).to.equal(undefined);
        expect(output.derivedProperty).to.equal(undefined);
        expect(output.overriddenProperty).to.equal(undefined);
    });

    it('combine', () => {
        let output = deserialize(SuperClass,serialize(new DerivedClass()));
        expect(output.superProperty).to.equal('super');
        expect(output.overriddenProperty).to.equal('overridden Derived');
        expect(output.derivedProperty).to.equal(undefined);
    });

});