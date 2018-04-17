import {TSMap} from "typescript-map";
import {Scheme} from "./Scheme";

export interface DescriptionSettings {
    scheme?: Scheme,
    serializedName?: string,
    postDeserialize?: Function
}

/**
 * Property decorator storage class
 */
export class PropertyDescription {

    public scheme: Scheme;
    public name: string;
    public serializedName: string;

    public constructor(propertyName: string, settings: DescriptionSettings = {}) {
        this.name = propertyName;
        this.setDecoration(settings);
    }

    /**
     * Add new property decorator settings here.
     *
     * @param {{[p: string]: any}} settings
     * @returns {PropertyDescription}
     */
    public setDecoration(settings: { [key: string]: any }): PropertyDescription {
        this.scheme = typeof settings.scheme === 'undefined'
            ? new Scheme()
            : settings.scheme;
        this.serializedName = typeof settings.serializedName === 'undefined'
            ? this.name
            : settings.serializedName;
        return this;
    }
}

/**
 * Class decorator storage
 */
export class ClassDescription {

    public postDeserialize: Function = () => {
    };
    public properties: TSMap<string, PropertyDescription> = new TSMap();

    public setDecoration(settings: DescriptionSettings): ClassDescription {
        if (typeof settings === 'undefined')
            return this;
        this.postDeserialize = typeof settings.postDeserialize === 'undefined'
            ? () => { }
            : settings.postDeserialize;
        return this;
    }
}

/**
 * Main decorator storage. This class will store and provide access to all decorators.
 */
export class Store extends TSMap<any, ClassDescription> {

    /**
     * Override Map getter. When no class description is found, we want to instantiate and return one. Class decorators
     * are optional, and this ensures we will get a default one when requested
     *
     * @param key
     * @returns {ClassDescription}
     */
    public get(key: any): ClassDescription {
        if (!this.has(key)) this.set(key, new ClassDescription());
        return super.get(key);
    }

}

export let store = new Store();

