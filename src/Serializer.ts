import {PropertyDescription, store} from "./Store";

/**
 * Serializer. Converts a JSON serializable tree to an object instance.
 *
 * @param type
 * @param src
 * @returns {any}
 */
export function deserialize(type: any, src: any): any {

    let ret = new type();

    let isDerivedClass = Object.getPrototypeOf(type) instanceof Function;
    if(isDerivedClass) {
        let extendedType = Object.getPrototypeOf(Object.getPrototypeOf(new type())).constructor;
        Object.assign(ret,deserialize(extendedType,src));
    }

    store.get(type).properties.forEach((property: PropertyDescription, propertyName: string) => {
        ret[propertyName] = property.scheme.deserializer(src[property.serializedName]);
    });

    store.get(type).postDeserialize(ret);

    return ret;
}

/**
 * Deserializer function. Converts an object to a JSON serializable graph.
 *
 * @param src
 * @returns {{[p: string]: any}}
 */
export function serialize(src: any): { [key: string]: any } {
    let ret: { [key: string]: any } = {};

    //parent
    if(Object.getPrototypeOf(Object.getPrototypeOf(src)).constructor !== Object) {
        let superClass = new (Object.getPrototypeOf(Object.getPrototypeOf(src)).constructor)();
        Object.assign(ret,serialize(superClass));
    }

    store.get(src.constructor).properties.forEach((property:PropertyDescription,propertyName:string) => {
        ret[property.serializedName] = property.scheme.serializer(src[propertyName]);
    });

    return ret;
}

