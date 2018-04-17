import {ClassDescriptionSettings, PropertyDescription, PropertyDescriptionSettings, store} from "./Store";

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
export function serializable(settings: ClassDescriptionSettings|PropertyDescriptionSettings = {}): any {

    return function(type:any, propertyName: string){

        // Class decorator
        if(arguments.length === 1) {
            store.get(type).setDecoration(<ClassDescriptionSettings>settings);
        }

        // Property decorator
        else if(arguments.length === 3) {
            store.get(type.constructor).properties.set(propertyName, new PropertyDescription(propertyName, <PropertyDescriptionSettings>settings));
        }

        else {
            throw new Error("Invalid decorator");
        }
    };

}

