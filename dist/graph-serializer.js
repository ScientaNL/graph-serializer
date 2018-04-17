var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
define("Scheme", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Scheme = /** @class */ (function () {
        function Scheme() {
            this.serializer = function (v) { return v; };
            this.deserializer = function (v) { return v; };
        }
        return Scheme;
    }());
    exports.Scheme = Scheme;
});
define("Store", ["require", "exports", "typescript-map", "Scheme"], function (require, exports, typescript_map_1, Scheme_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Property decorator storage class
     */
    var PropertyDescription = /** @class */ (function () {
        function PropertyDescription(propertyName, settings) {
            if (settings === void 0) { settings = {}; }
            this.name = propertyName;
            this.setDecoration(settings);
        }
        /**
         * Add new property decorator settings here.
         *
         * @param {{[p: string]: any}} settings
         * @returns {PropertyDescription}
         */
        PropertyDescription.prototype.setDecoration = function (settings) {
            this.scheme = typeof settings.scheme === 'undefined'
                ? new Scheme_1.Scheme()
                : settings.scheme;
            this.serializedName = typeof settings.serializedName === 'undefined'
                ? this.name
                : settings.serializedName;
            return this;
        };
        return PropertyDescription;
    }());
    exports.PropertyDescription = PropertyDescription;
    /**
     * Class decorator storage
     */
    var ClassDescription = /** @class */ (function () {
        function ClassDescription() {
            this.postDeserialize = function () { };
            this.properties = new typescript_map_1.TSMap();
        }
        ClassDescription.prototype.setDecoration = function (settings) {
            if (typeof settings === 'undefined')
                return this;
            this.postDeserialize = typeof settings.postDeserialize === 'undefined'
                ? function () { }
                : settings.postDeserialize;
            return this;
        };
        return ClassDescription;
    }());
    exports.ClassDescription = ClassDescription;
    /**
     * Main decorator storage. This class will store and provide access to all decorators.
     */
    var Store = /** @class */ (function (_super) {
        __extends(Store, _super);
        function Store() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        /**
         * Override Map getter. When no class description is found, we want to instantiate and return one. Class decorators
         * are optional, and this ensures we will get a default one when requested
         *
         * @param key
         * @returns {ClassDescription}
         */
        Store.prototype.get = function (key) {
            if (!this.has(key))
                this.set(key, new ClassDescription());
            return _super.prototype.get.call(this, key);
        };
        return Store;
    }(typescript_map_1.TSMap));
    exports.Store = Store;
    exports.store = new Store();
});
define("Decorators", ["require", "exports", "Store"], function (require, exports, Store_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
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
    function serializable(settings) {
        if (settings === void 0) { settings = {}; }
        return function (type, propertyName) {
            // Class decorator
            if (arguments.length === 1) {
                Store_1.store.get(type).setDecoration(settings);
            }
            // Property decorator
            else if (arguments.length === 3) {
                Store_1.store.get(type.constructor).properties.set(propertyName, new Store_1.PropertyDescription(propertyName, settings));
            }
            else {
                throw new Error("Invalid decorator");
            }
        };
    }
    exports.serializable = serializable;
});
define("Serializer", ["require", "exports", "Store"], function (require, exports, Store_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Serializer. Converts a JSON serializable tree to an object instance.
     *
     * @param type
     * @param src
     * @returns {any}
     */
    function deserialize(type, src) {
        var ret = new type();
        var isDerivedClass = Object.getPrototypeOf(type) instanceof Function;
        if (isDerivedClass) {
            var extendedType = Object.getPrototypeOf(Object.getPrototypeOf(new type())).constructor;
            Object.assign(ret, deserialize(extendedType, src));
        }
        Store_2.store.get(type).properties.forEach(function (property, propertyName) {
            ret[propertyName] = property.scheme.deserializer(src[property.serializedName]);
        });
        Store_2.store.get(type).postDeserialize(ret);
        return ret;
    }
    exports.deserialize = deserialize;
    /**
     * Deserializer function. Converts an object to a JSON serializable graph.
     *
     * @param src
     * @returns {{[p: string]: any}}
     */
    function serialize(src) {
        var ret = {};
        //parent
        if (Object.getPrototypeOf(Object.getPrototypeOf(src)).constructor !== Object) {
            var superClass = new (Object.getPrototypeOf(Object.getPrototypeOf(src)).constructor)();
            Object.assign(ret, serialize(superClass));
        }
        Store_2.store.get(src.constructor).properties.forEach(function (property, propertyName) {
            ret[property.serializedName] = property.scheme.serializer(src[propertyName]);
        });
        return ret;
    }
    exports.serialize = serialize;
});
define("Types", ["require", "exports", "Scheme", "Serializer"], function (require, exports, Scheme_2, Serializer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Primitive, the default scheme. This will return properties as-is on deserialize. This is exported as const because
     * the primitive scheme should never change.
     * @type {Scheme}
     */
    exports.primitive = new Scheme_2.Scheme();
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
    exports.date = (function () {
        var scheme = new Scheme_2.Scheme();
        scheme.serializer = function (v) { return (v instanceof Date) ? v.toJSON() : v; };
        scheme.deserializer = function (v) { return (typeof v === 'string') ? new Date(v) : v; };
        return scheme;
    })();
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
    function array(childScheme) {
        if (childScheme === void 0) { childScheme = exports.primitive; }
        var scheme = new Scheme_2.Scheme();
        scheme.serializer = function (v) {
            return v.map(function (w) { return childScheme.serializer(w); });
        };
        scheme.deserializer = function (v) {
            if (v === undefined)
                return v;
            return v.map(function (w) { return childScheme.deserializer(w); });
        };
        return scheme;
    }
    exports.array = array;
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
    function object(type) {
        var scheme = new Scheme_2.Scheme();
        scheme.serializer = function (v) { return Serializer_1.serialize(v); };
        scheme.deserializer = function (v) { return Serializer_1.deserialize(type, v); };
        return scheme;
    }
    exports.object = object;
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
    function custom(serializer, deserializer) {
        var scheme = new Scheme_2.Scheme();
        scheme.serializer = serializer;
        scheme.deserializer = deserializer;
        return scheme;
    }
    exports.custom = custom;
});
define("graph-serializer", ["require", "exports", "Scheme", "Store", "Types", "Serializer", "Decorators"], function (require, exports, Scheme_3, Store_3, Types_1, Serializer_2, Decorators_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Scheme = Scheme_3.Scheme;
    exports.ClassDescription = Store_3.ClassDescription;
    exports.PropertyDescription = Store_3.PropertyDescription;
    exports.Store = Store_3.Store;
    exports.array = Types_1.array;
    exports.custom = Types_1.custom;
    exports.date = Types_1.date;
    exports.object = Types_1.object;
    exports.primitive = Types_1.primitive;
    exports.deserialize = Serializer_2.deserialize;
    exports.serialize = Serializer_2.serialize;
    exports.serializable = Decorators_1.serializable;
});

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9TY2hlbWUudHMiLCJzcmMvU3RvcmUudHMiLCJzcmMvRGVjb3JhdG9ycy50cyIsInNyYy9TZXJpYWxpemVyLnRzIiwic3JjL1R5cGVzLnRzIiwic3JjL2dyYXBoLXNlcmlhbGl6ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztJQUFBO1FBQUE7WUFDVyxlQUFVLEdBQW9CLFVBQUMsQ0FBTSxJQUFLLE9BQUEsQ0FBQyxFQUFELENBQUMsQ0FBQztZQUM1QyxpQkFBWSxHQUFvQixVQUFDLENBQU0sSUFBSyxPQUFBLENBQUMsRUFBRCxDQUFDLENBQUM7UUFDekQsQ0FBQztRQUFELGFBQUM7SUFBRCxDQUhBLEFBR0MsSUFBQTtJQUhZLHdCQUFNOzs7OztJQ0duQjs7T0FFRztJQUNIO1FBTUksNkJBQW1CLFlBQW9CLEVBQUUsUUFBZ0M7WUFBaEMseUJBQUEsRUFBQSxhQUFnQztZQUNyRSxJQUFJLENBQUMsSUFBSSxHQUFHLFlBQVksQ0FBQztZQUN6QixJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ2pDLENBQUM7UUFFRDs7Ozs7V0FLRztRQUNJLDJDQUFhLEdBQXBCLFVBQXFCLFFBQTJCO1lBQzVDLElBQUksQ0FBQyxNQUFNLEdBQUcsT0FBTyxRQUFRLENBQUMsTUFBTSxLQUFLLFdBQVc7Z0JBQ2hELENBQUMsQ0FBQyxJQUFJLGVBQU0sRUFBRTtnQkFDZCxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQztZQUN0QixJQUFJLENBQUMsY0FBYyxHQUFHLE9BQU8sUUFBUSxDQUFDLGNBQWMsS0FBSyxXQUFXO2dCQUNoRSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUk7Z0JBQ1gsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxjQUFjLENBQUM7WUFDOUIsT0FBTyxJQUFJLENBQUM7UUFDaEIsQ0FBQztRQUNMLDBCQUFDO0lBQUQsQ0ExQkEsQUEwQkMsSUFBQTtJQTFCWSxrREFBbUI7SUE0QmhDOztPQUVHO0lBQ0g7UUFB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QUFLLElBQUssT0FBQSxzQkFBUyxDQUFDLENBQUMsQ0FBQyxFQUFaLENBQVksQ0FBQztRQUM1QyxNQUFNLENBQUMsWUFBWSxHQUFHLFVBQUMsQ0FBSyxJQUFLLE9BQUEsd0JBQVcsQ0FBQyxJQUFJLEVBQUMsQ0FBQyxDQUFDLEVBQW5CLENBQW1CLENBQUM7UUFDckQsT0FBTyxNQUFNLENBQUM7SUFDbEIsQ0FBQztJQUxELHdCQUtDO0lBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7T0FzQkc7SUFDSCxnQkFBdUIsVUFBMkIsRUFBRSxZQUE2QjtRQUM3RSxJQUFJLE1BQU0sR0FBRyxJQUFJLGVBQU0sRUFBRSxDQUFDO1FBQzFCLE1BQU0sQ0FBQyxVQUFVLEdBQUcsVUFBVSxDQUFDO1FBQy9CLE1BQU0sQ0FBQyxZQUFZLEdBQUcsWUFBWSxDQUFDO1FBQ25DLE9BQU8sTUFBTSxDQUFDO0lBQ2xCLENBQUM7SUFMRCx3QkFLQzs7Ozs7SUMxR1EsMEJBQUEsTUFBTSxDQUFBO0lBQ04sbUNBQUEsZ0JBQWdCLENBQUE7SUFBRSxzQ0FBQSxtQkFBbUIsQ0FBQTtJQUFFLHdCQUFBLEtBQUssQ0FBQTtJQUM1Qyx3QkFBQSxLQUFLLENBQUE7SUFBRSx5QkFBQSxNQUFNLENBQUE7SUFBRSx1QkFBQSxJQUFJLENBQUE7SUFBRSx5QkFBQSxNQUFNLENBQUE7SUFBRSw0QkFBQSxTQUFTLENBQUE7SUFDdEMsbUNBQUEsV0FBVyxDQUFBO0lBQUUsaUNBQUEsU0FBUyxDQUFBO0lBQ3RCLG9DQUFBLFlBQVksQ0FBQSIsImZpbGUiOiJncmFwaC1zZXJpYWxpemVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGNsYXNzIFNjaGVtZSB7XG4gICAgcHVibGljIHNlcmlhbGl6ZXI6ICh2OiBhbnkpID0+IGFueSA9ICh2OiBhbnkpID0+IHY7XG4gICAgcHVibGljIGRlc2VyaWFsaXplcjogKHY6IGFueSkgPT4gYW55ID0gKHY6IGFueSkgPT4gdjtcbn1cbiIsImltcG9ydCB7VFNNYXB9IGZyb20gXCJ0eXBlc2NyaXB0LW1hcFwiO1xuaW1wb3J0IHtTY2hlbWV9IGZyb20gXCIuL1NjaGVtZVwiO1xuXG4vKipcbiAqIFByb3BlcnR5IGRlY29yYXRvciBzdG9yYWdlIGNsYXNzXG4gKi9cbmV4cG9ydCBjbGFzcyBQcm9wZXJ0eURlc2NyaXB0aW9uIHtcblxuICAgIHB1YmxpYyBzY2hlbWU6U2NoZW1lO1xuICAgIHB1YmxpYyBuYW1lOiBzdHJpbmc7XG4gICAgcHVibGljIHNlcmlhbGl6ZWROYW1lOnN0cmluZztcblxuICAgIHB1YmxpYyBjb25zdHJ1Y3Rvcihwcm9wZXJ0eU5hbWU6IHN0cmluZywgc2V0dGluZ3M6e1trZXk6c3RyaW5nXTphbnl9ID0ge30pIHtcbiAgICAgICAgdGhpcy5uYW1lID0gcHJvcGVydHlOYW1lO1xuICAgICAgICB0aGlzLnNldERlY29yYXRpb24oc2V0dGluZ3MpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFkZCBuZXcgcHJvcGVydHkgZGVjb3JhdG9yIHNldHRpbmdzIGhlcmUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3tbcDogc3RyaW5nXTogYW55fX0gc2V0dGluZ3NcbiAgICAgKiBAcmV0dXJucyB7UHJvcGVydHlEZXNjcmlwdGlvbn1cbiAgICAgKi9cbiAgICBwdWJsaWMgc2V0RGVjb3JhdGlvbihzZXR0aW5nczp7W2tleTpzdHJpbmddOmFueX0pOlByb3BlcnR5RGVzY3JpcHRpb24ge1xuICAgICAgICB0aGlzLnNjaGVtZSA9IHR5cGVvZiBzZXR0aW5ncy5zY2hlbWUgPT09ICd1bmRlZmluZWQnXG4gICAgICAgICAgICA/IG5ldyBTY2hlbWUoKVxuICAgICAgICAgICAgOiBzZXR0aW5ncy5zY2hlbWU7XG4gICAgICAgIHRoaXMuc2VyaWFsaXplZE5hbWUgPSB0eXBlb2Ygc2V0dGluZ3Muc2VyaWFsaXplZE5hbWUgPT09ICd1bmRlZmluZWQnXG4gICAgICAgICAgICA/IHRoaXMubmFtZVxuICAgICAgICAgICAgOiBzZXR0aW5ncy5zZXJpYWxpemVkTmFtZTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxufVxuXG4vKipcbiAqIENsYXNzIGRlY29yYXRvciBzdG9yYWdlXG4gKi9cbmV4cG9ydCBjbGFzcyBDbGFzc0Rlc2NyaXB0aW9uIHtcblxuICAgIHB1YmxpYyBwb3N0RGVzZXJpYWxpemU6IEZ1bmN0aW9uID0gKCk9Pnt9O1xuICAgIHB1YmxpYyBwcm9wZXJ0aWVzOiBUU01hcDxzdHJpbmcsUHJvcGVydHlEZXNjcmlwdGlvbj4gPSBuZXcgVFNNYXAoKTtcblxuICAgIHB1YmxpYyBzZXREZWNvcmF0aW9uKHNldHRpbmdzOntba2V5OnN0cmluZ106YW55fSk6Q2xhc3NEZXNjcmlwdGlvbiB7XG4gICAgICAgIGlmKHR5cGVvZiBzZXR0aW5ncyA9PT0gJ3VuZGVmaW5lZCcpXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgdGhpcy5wb3N0RGVzZXJpYWxpemUgPSB0eXBlb2Ygc2V0dGluZ3MucG9zdERlc2VyaWFsaXplID09PSAndW5kZWZpbmVkJ1xuICAgICAgICAgICAgPyAoKT0+e31cbiAgICAgICAgICAgIDogc2V0dGluZ3MucG9zdERlc2VyaWFsaXplO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG59XG5cbi8qKlxuICogTWFpbiBkZWNvcmF0b3Igc3RvcmFnZS4gVGhpcyBjbGFzcyB3aWxsIHN0b3JlIGFuZCBwcm92aWRlIGFjY2VzcyB0byBhbGwgZGVjb3JhdG9ycy5cbiAqL1xuZXhwb3J0IGNsYXNzIFN0b3JlIGV4dGVuZHMgVFNNYXA8YW55LENsYXNzRGVzY3JpcHRpb24+IHtcblxuICAgIC8qKlxuICAgICAqIE92ZXJyaWRlIE1hcCBnZXR0ZXIuIFdoZW4gbm8gY2xhc3MgZGVzY3JpcHRpb24gaXMgZm91bmQsIHdlIHdhbnQgdG8gaW5zdGFudGlhdGUgYW5kIHJldHVybiBvbmUuIENsYXNzIGRlY29yYXRvcnNcbiAgICAgKiBhcmUgb3B0aW9uYWwsIGFuZCB0aGlzIGVuc3VyZXMgd2Ugd2lsbCBnZXQgYSBkZWZhdWx0IG9uZSB3aGVuIHJlcXVlc3RlZFxuICAgICAqXG4gICAgICogQHBhcmFtIGtleVxuICAgICAqIEByZXR1cm5zIHtDbGFzc0Rlc2NyaXB0aW9ufVxuICAgICAqL1xuICAgIHB1YmxpYyBnZXQoa2V5OmFueSk6Q2xhc3NEZXNjcmlwdGlvbiB7XG4gICAgICAgIGlmKCF0aGlzLmhhcyhrZXkpKSB0aGlzLnNldChrZXksbmV3IENsYXNzRGVzY3JpcHRpb24oKSk7XG4gICAgICAgIHJldHVybiBzdXBlci5nZXQoa2V5KTtcbiAgICB9XG5cbn1cblxuZXhwb3J0IGxldCBzdG9yZSA9IG5ldyBTdG9yZSgpO1xuXG4iLCJpbXBvcnQge1Byb3BlcnR5RGVzY3JpcHRpb24sIHN0b3JlfSBmcm9tIFwiLi9TdG9yZVwiO1xyXG5cclxuLyoqXHJcbiAqIFNlcmlhbGl6YWJsZSBkZWNvcmF0b3IuIFRoZSBkZWNvcmF0b3IgbWF5IHJlY2VpdmUgYW4gb2JqZWN0IHdpdGggc2V0dGluZ3MuIEV4YW1wbGUgdXNhZ2U6XHJcbiAqXHJcbiAqIGBgYFxyXG4gKiBAc2VyaWFsaXphYmxlKHtcclxuICogICAgICBwb3N0RGVzZXJpYWxpemU6IGZ1bmN0aW9uKG9iail7IFsuLi5dIH1cclxuICogfSlcclxuICogY2xhc3MgRXhhbXBsZUNsYXNzIHtcclxuICogIEBzZXJpYWxpemFibGUoKVxyXG4gKiAgcHVibGljIG5hbWU6IHN0cmluZztcclxuICpcclxuICogIEBzZXJpYWxpemFibGUoe1xyXG4gKiAgICAgIHNlcmlhbGl6ZWROYW1lOiB0YWdzXHJcbiAqICAgICAgc2NoZW1lOiBhcnJheSgpXHJcbiAqICB9KVxyXG4gKiAgcHVibGljIHRhZ0Fycjogc3RyaW5nW107XHJcbiAqIH1cclxuICogYGBgXHJcbiAqXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gc2VyaWFsaXphYmxlKHNldHRpbmdzOiBvYmplY3QgPSB7fSk6IGFueSB7XHJcblxyXG4gICAgcmV0dXJuIGZ1bmN0aW9uKHR5cGU6YW55LCBwcm9wZXJ0eU5hbWU6IHN0cmluZyl7XHJcblxyXG4gICAgICAgIC8vIENsYXNzIGRlY29yYXRvclxyXG4gICAgICAgIGlmKGFyZ3VtZW50cy5sZW5ndGggPT09IDEpIHtcclxuICAgICAgICAgICAgc3RvcmUuZ2V0KHR5cGUpLnNldERlY29yYXRpb24oc2V0dGluZ3MpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gUHJvcGVydHkgZGVjb3JhdG9yXHJcbiAgICAgICAgZWxzZSBpZihhcmd1bWVudHMubGVuZ3RoID09PSAzKSB7XHJcbiAgICAgICAgICAgIHN0b3JlLmdldCh0eXBlLmNvbnN0cnVjdG9yKS5wcm9wZXJ0aWVzLnNldChwcm9wZXJ0eU5hbWUsIG5ldyBQcm9wZXJ0eURlc2NyaXB0aW9uKHByb3BlcnR5TmFtZSwgc2V0dGluZ3MpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIGRlY29yYXRvclwiKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxufVxyXG5cclxuIiwiaW1wb3J0IHtQcm9wZXJ0eURlc2NyaXB0aW9uLCBzdG9yZX0gZnJvbSBcIi4vU3RvcmVcIjtcblxuLyoqXG4gKiBTZXJpYWxpemVyLiBDb252ZXJ0cyBhIEpTT04gc2VyaWFsaXphYmxlIHRyZWUgdG8gYW4gb2JqZWN0IGluc3RhbmNlLlxuICpcbiAqIEBwYXJhbSB0eXBlXG4gKiBAcGFyYW0gc3JjXG4gKiBAcmV0dXJucyB7YW55fVxuICovXG5leHBvcnQgZnVuY3Rpb24gZGVzZXJpYWxpemUodHlwZTogYW55LCBzcmM6IGFueSk6IGFueSB7XG5cbiAgICBsZXQgcmV0ID0gbmV3IHR5cGUoKTtcblxuICAgIGxldCBpc0Rlcml2ZWRDbGFzcyA9IE9iamVjdC5nZXRQcm90b3R5cGVPZih0eXBlKSBpbnN0YW5jZW9mIEZ1bmN0aW9uO1xuICAgIGlmKGlzRGVyaXZlZENsYXNzKSB7XG4gICAgICAgIGxldCBleHRlbmRlZFR5cGUgPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YoT2JqZWN0LmdldFByb3RvdHlwZU9mKG5ldyB0eXBlKCkpKS5jb25zdHJ1Y3RvcjtcbiAgICAgICAgT2JqZWN0LmFzc2lnbihyZXQsZGVzZXJpYWxpemUoZXh0ZW5kZWRUeXBlLHNyYykpO1xuICAgIH1cblxuICAgIHN0b3JlLmdldCh0eXBlKS5wcm9wZXJ0aWVzLmZvckVhY2goKHByb3BlcnR5OiBQcm9wZXJ0eURlc2NyaXB0aW9uLCBwcm9wZXJ0eU5hbWU6IHN0cmluZykgPT4ge1xuICAgICAgICByZXRbcHJvcGVydHlOYW1lXSA9IHByb3BlcnR5LnNjaGVtZS5kZXNlcmlhbGl6ZXIoc3JjW3Byb3BlcnR5LnNlcmlhbGl6ZWROYW1lXSk7XG4gICAgfSk7XG5cbiAgICBzdG9yZS5nZXQodHlwZSkucG9zdERlc2VyaWFsaXplKHJldCk7XG5cbiAgICByZXR1cm4gcmV0O1xufVxuXG4vKipcbiAqIERlc2VyaWFsaXplciBmdW5jdGlvbi4gQ29udmVydHMgYW4gb2JqZWN0IHRvIGEgSlNPTiBzZXJpYWxpemFibGUgZ3JhcGguXG4gKlxuICogQHBhcmFtIHNyY1xuICogQHJldHVybnMge3tbcDogc3RyaW5nXTogYW55fX1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNlcmlhbGl6ZShzcmM6IGFueSk6IHsgW2tleTogc3RyaW5nXTogYW55IH0ge1xuICAgIGxldCByZXQ6IHsgW2tleTogc3RyaW5nXTogYW55IH0gPSB7fTtcblxuICAgIC8vcGFyZW50XG4gICAgaWYoT2JqZWN0LmdldFByb3RvdHlwZU9mKE9iamVjdC5nZXRQcm90b3R5cGVPZihzcmMpKS5jb25zdHJ1Y3RvciAhPT0gT2JqZWN0KSB7XG4gICAgICAgIGxldCBzdXBlckNsYXNzID0gbmV3IChPYmplY3QuZ2V0UHJvdG90eXBlT2YoT2JqZWN0LmdldFByb3RvdHlwZU9mKHNyYykpLmNvbnN0cnVjdG9yKSgpO1xuICAgICAgICBPYmplY3QuYXNzaWduKHJldCxzZXJpYWxpemUoc3VwZXJDbGFzcykpO1xuICAgIH1cblxuICAgIHN0b3JlLmdldChzcmMuY29uc3RydWN0b3IpLnByb3BlcnRpZXMuZm9yRWFjaCgocHJvcGVydHk6UHJvcGVydHlEZXNjcmlwdGlvbixwcm9wZXJ0eU5hbWU6c3RyaW5nKSA9PiB7XG4gICAgICAgIHJldFtwcm9wZXJ0eS5zZXJpYWxpemVkTmFtZV0gPSBwcm9wZXJ0eS5zY2hlbWUuc2VyaWFsaXplcihzcmNbcHJvcGVydHlOYW1lXSk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gcmV0O1xufVxuXG4iLCJpbXBvcnQge1NjaGVtZX0gZnJvbSBcIi4vU2NoZW1lXCI7XHJcbmltcG9ydCB7ZGVzZXJpYWxpemUsIHNlcmlhbGl6ZX0gZnJvbSBcIi4vU2VyaWFsaXplclwiO1xyXG5cclxuLyoqXHJcbiAqIFByaW1pdGl2ZSwgdGhlIGRlZmF1bHQgc2NoZW1lLiBUaGlzIHdpbGwgcmV0dXJuIHByb3BlcnRpZXMgYXMtaXMgb24gZGVzZXJpYWxpemUuIFRoaXMgaXMgZXhwb3J0ZWQgYXMgY29uc3QgYmVjYXVzZVxyXG4gKiB0aGUgcHJpbWl0aXZlIHNjaGVtZSBzaG91bGQgbmV2ZXIgY2hhbmdlLlxyXG4gKiBAdHlwZSB7U2NoZW1lfVxyXG4gKi9cclxuZXhwb3J0IGNvbnN0IHByaW1pdGl2ZSA9IG5ldyBTY2hlbWUoKTtcclxuXHJcbi8qKlxyXG4gKiBEYXRlIHNjaGVtZS4gVGhpcyBzY2hlbWUgd2lsbCBwcm9wZXJseSBzZXJpYWxpemUgYW5kIGRlc2VyaWFsaXplIGphdmFzY3JpcHQgRGF0ZSBvYmplY3RzLlxyXG4gKlxyXG4gKiBFeGFtcGxlIHVzYWdlOlxyXG4gKiBgYGBcclxuICogY2xhc3MgVGVzdENsYXNzIHtcclxuICogIEBzZXJpYWxpemFibGUoZGF0ZSlcclxuICogIHB1YmxpYyBjaGlsZHJlbjogRGF0ZTtcclxuICogfVxyXG4gKiBgYGBcclxuICpcclxuICogQHR5cGUge1NjaGVtZX1cclxuICovXHJcbmV4cG9ydCBjb25zdCBkYXRlID0gKGZ1bmN0aW9uKCl7XHJcbiAgICBsZXQgc2NoZW1lID0gbmV3IFNjaGVtZSgpO1xyXG4gICAgc2NoZW1lLnNlcmlhbGl6ZXIgPSAodjpEYXRlKSA9PiAodiBpbnN0YW5jZW9mIERhdGUpID8gdi50b0pTT04oKSA6IHY7XHJcbiAgICBzY2hlbWUuZGVzZXJpYWxpemVyID0gKHY6c3RyaW5nKSA9PiAodHlwZW9mIHYgPT09ICdzdHJpbmcnKSA/IG5ldyBEYXRlKHYpIDogdjtcclxuICAgIHJldHVybiBzY2hlbWU7XHJcbn0pKCk7XHJcblxyXG4vKipcclxuICogVGhlIGFycmF5IGZ1bmN0aW9uIHdpbGwgYXBwbHkgYSBzY2hlbWUgdG8gYWxsIG9mIGl0cyBjaGlsZHJlbi5cclxuICpcclxuICogRXhhbXBsZSB1c2FnZTpcclxuICogYGBgXHJcbiAqIGNsYXNzIFRlc3RDbGFzcyB7XHJcbiAqICBAc2VyaWFsaXphYmxlKGFycmF5KCkpXHJcbiAqICBwdWJsaWMgY2hpbGRyZW46IHN0cmluZ1tdO1xyXG4gKiB9XHJcbiAqIGBgYFxyXG4gKlxyXG4gKiBAcGFyYW0ge1NjaGVtZX0gY2hpbGRTY2hlbWVcclxuICogQHJldHVybnMge1NjaGVtZX1cclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBhcnJheShjaGlsZFNjaGVtZTogU2NoZW1lID0gcHJpbWl0aXZlKSB7XHJcbiAgICBsZXQgc2NoZW1lID0gbmV3IFNjaGVtZSgpO1xyXG4gICAgc2NoZW1lLnNlcmlhbGl6ZXIgPSAodjogYW55KSA9PiB7XHJcbiAgICAgICAgcmV0dXJuIHYubWFwKCh3OiBhbnkpID0+IGNoaWxkU2NoZW1lLnNlcmlhbGl6ZXIodykpXHJcbiAgICB9O1xyXG4gICAgc2NoZW1lLmRlc2VyaWFsaXplciA9ICh2OiBhbnkpID0+IHtcclxuICAgICAgICBpZih2ID09PSB1bmRlZmluZWQpIHJldHVybiB2O1xyXG4gICAgICAgIHJldHVybiB2Lm1hcCgodzogYW55KSA9PiBjaGlsZFNjaGVtZS5kZXNlcmlhbGl6ZXIodykpXHJcbiAgICB9O1xyXG4gICAgcmV0dXJuIHNjaGVtZTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFRoZSBvYmplY3QgZnVuY3Rpb24gd2lsbCBzZXJpYWxpemUgYSBuZXN0ZWQgb2JqZWN0XHJcbiAqXHJcbiAqIEV4YW1wbGUgdXNhZ2U6XHJcbiAqIGBgYFxyXG4gKiBjbGFzcyBBIHsgbmFtZTogc3RyaW5nIH1cclxuICogY2xhc3MgQiB7XHJcbiAqICAgQHNlcmlhbGl6YWJsZShvYmplY3QoQSkpXHJcbiAqICAgcHVibGljIG5lc3RlZE9iamVjdDogQTtcclxuICogfVxyXG4gKiBgYGBcclxuICpcclxuICogQHBhcmFtIHR5cGVcclxuICogQHJldHVybnMge1NjaGVtZX1cclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBvYmplY3QodHlwZTogYW55KTogU2NoZW1lIHtcclxuICAgIGxldCBzY2hlbWUgPSBuZXcgU2NoZW1lKCk7XHJcbiAgICBzY2hlbWUuc2VyaWFsaXplciA9ICh2OmFueSkgPT4gc2VyaWFsaXplKHYpO1xyXG4gICAgc2NoZW1lLmRlc2VyaWFsaXplciA9ICh2OmFueSkgPT4gZGVzZXJpYWxpemUodHlwZSx2KTtcclxuICAgIHJldHVybiBzY2hlbWU7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBUaGUgY3VzdG9tIGZ1bmN0aW9uIGFsbG93cyB5b3UgdG8gY3JlYXRlIHlvdXIgb3duIHNlcmlhbGl6ZXIgZnVuY3Rpb25hbGl0eS4gVXNlZCBpbiBwb2x5bW9ycGggdHlwZXMgYW5kIGFycmF5cy5cclxuICpcclxuICogRXhhbXBsZSB1c2FnZTpcclxuICogYGBgXHJcbiAqIGNsYXNzIEEgeyBwdWJsaWMgdHlwZSA9ICdhJzsgfVxyXG4gKiBjbGFzcyBCIHsgcHVibGljIHR5cGUgPSAnYic7IH1cclxuICogY2xhc3MgVGVzdENsYXNzIHtcclxuICogIEBzZXJpYWxpemFibGUoY3VzdG9tKFxyXG4gKiAgICAgICh2OmFueSk9PnYsXHJcbiAqICAgICAgKHY6YW55KSA9PiBkZXNlcmlhbGl6ZSh7XHJcbiAqICAgICAgICAgICdhJzpBLFxyXG4gKiAgICAgICAgICAnYic6QlxyXG4gKiAgICAgIH1bdi50eXBlXSx2KVxyXG4gKiAgKSlcclxuICogIHB1YmxpYyB0ZXN0OiBBfEI7XHJcbiAqIH1cclxuICogYGBgXHJcbiAqXHJcbiAqIEBwYXJhbSB7KHY6IGFueSkgPT4gYW55fSBzZXJpYWxpemVyXHJcbiAqIEBwYXJhbSB7KHY6IGFueSkgPT4gYW55fSBkZXNlcmlhbGl6ZXJcclxuICogQHJldHVybnMge1NjaGVtZX1cclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBjdXN0b20oc2VyaWFsaXplcjogKHY6IGFueSkgPT4gYW55LCBkZXNlcmlhbGl6ZXI6ICh2OiBhbnkpID0+IGFueSk6IFNjaGVtZSB7XHJcbiAgICBsZXQgc2NoZW1lID0gbmV3IFNjaGVtZSgpO1xyXG4gICAgc2NoZW1lLnNlcmlhbGl6ZXIgPSBzZXJpYWxpemVyO1xyXG4gICAgc2NoZW1lLmRlc2VyaWFsaXplciA9IGRlc2VyaWFsaXplcjtcclxuICAgIHJldHVybiBzY2hlbWU7XHJcbn1cclxuXHJcbiIsImV4cG9ydCB7IFNjaGVtZSB9IGZyb20gXCIuL1NjaGVtZVwiO1xuZXhwb3J0IHsgQ2xhc3NEZXNjcmlwdGlvbiwgUHJvcGVydHlEZXNjcmlwdGlvbiwgU3RvcmUgfSBmcm9tIFwiLi9TdG9yZVwiO1xuZXhwb3J0IHsgYXJyYXksIGN1c3RvbSwgZGF0ZSwgb2JqZWN0LCBwcmltaXRpdmV9IGZyb20gXCIuL1R5cGVzXCI7XG5leHBvcnQgeyBkZXNlcmlhbGl6ZSwgc2VyaWFsaXplIH0gZnJvbSBcIi4vU2VyaWFsaXplclwiO1xuZXhwb3J0IHsgc2VyaWFsaXphYmxlIH0gZnJvbSBcIi4vRGVjb3JhdG9yc1wiO1xuXG4iXX0=
