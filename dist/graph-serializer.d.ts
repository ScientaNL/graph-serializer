declare module "Scheme" {
    export class Scheme {
        serializer: (v: any) => any;
        deserializer: (v: any) => any;
    }
}
declare module "Store" {
    import { TSMap } from "typescript-map";
    import { Scheme } from "Scheme";
    export interface PropertyDescriptionSettings {
        scheme?: Scheme;
        serializedName?: string;
    }
    /**
     * Property decorator storage class
     */
    export class PropertyDescription {
        scheme: Scheme;
        name: string;
        serializedName: string;
        constructor(propertyName: string, settings?: PropertyDescriptionSettings);
        /**
         * Add new property decorator settings here.
         *
         * @param {{[p: string]: any}} settings
         * @returns {PropertyDescription}
         */
        setDecoration(settings: {
            [key: string]: any;
        }): PropertyDescription;
    }
    export interface ClassDescriptionSettings {
        postDeserialize?: Function;
    }
    /**
     * Class decorator storage
     */
    export class ClassDescription {
        postDeserialize: Function;
        properties: TSMap<string, PropertyDescription>;
        setDecoration(settings: ClassDescriptionSettings): ClassDescription;
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
        get(key: any): ClassDescription;
    }
    export let store: Store;
}
declare module "Decorators" {
    /**
     * Serializable decorator. The decorator may receive an object with settings. Example usage:
     *
     * ```
     * @serializable({
     *      postDeserialize: function(obj){ [...] }
     * })
     * class ExampleClass {
     *  @serializable()
     *  public name: string;
     *
     *  @serializable({
     *      serializedName: tags
     *      scheme: array()
     *  })
     *  public tagArr: string[];
     * }
     * ```
     *
     */
    export function serializable(settings?: object): any;
}
declare module "Serializer" {
    /**
     * Serializer. Converts a JSON serializable tree to an object instance.
     *
     * @param type
     * @param src
     * @returns {any}
     */
    export function deserialize(type: any, src: any): any;
    /**
     * Deserializer function. Converts an object to a JSON serializable graph.
     *
     * @param src
     * @returns {{[p: string]: any}}
     */
    export function serialize(src: any): {
        [key: string]: any;
    };
}
declare module "Types" {
    import { Scheme } from "Scheme";
    /**
     * Primitive, the default scheme. This will return properties as-is on deserialize. This is exported as const because
     * the primitive scheme should never change.
     * @type {Scheme}
     */
    export const primitive: Scheme;
    /**
     * Date scheme. This scheme will properly serialize and deserialize javascript Date objects.
     *
     * Example usage:
     * ```
     * class TestClass {
     *  @serializable(date)
     *  public children: Date;
     * }
     * ```
     *
     * @type {Scheme}
     */
    export const date: Scheme;
    /**
     * The array function will apply a scheme to all of its children.
     *
     * Example usage:
     * ```
     * class TestClass {
     *  @serializable(array())
     *  public children: string[];
     * }
     * ```
     *
     * @param {Scheme} childScheme
     * @returns {Scheme}
     */
    export function array(childScheme?: Scheme): Scheme;
    /**
     * The object function will serialize a nested object
     *
     * Example usage:
     * ```
     * class A { name: string }
     * class B {
     *   @serializable(object(A))
     *   public nestedObject: A;
     * }
     * ```
     *
     * @param type
     * @returns {Scheme}
     */
    export function object(type: any): Scheme;
    /**
     * The custom function allows you to create your own serializer functionality. Used in polymorph types and arrays.
     *
     * Example usage:
     * ```
     * class A { public type = 'a'; }
     * class B { public type = 'b'; }
     * class TestClass {
     *  @serializable(custom(
     *      (v:any)=>v,
     *      (v:any) => deserialize({
     *          'a':A,
     *          'b':B
     *      }[v.type],v)
     *  ))
     *  public test: A|B;
     * }
     * ```
     *
     * @param {(v: any) => any} serializer
     * @param {(v: any) => any} deserializer
     * @returns {Scheme}
     */
    export function custom(serializer: (v: any) => any, deserializer: (v: any) => any): Scheme;
}
declare module "graph-serializer" {
    export { Scheme } from "Scheme";
    export { ClassDescription, ClassDescriptionSettings, PropertyDescription, PropertyDescriptionSettings, Store } from "Store";
    export { array, custom, date, object, primitive } from "Types";
    export { deserialize, serialize } from "Serializer";
    export { serializable } from "Decorators";
}
