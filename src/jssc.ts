type IAjaxOption = {
    url?:string,
    data?:unknown,
    type?:"get"|"post",
    contentType?:string,
    dataType?:string
}

type IAjax = {(url:string,option:IAjaxOption):Promise<any>}

type ServiceCreaterOption = {
    ajax:IAjax
    ajaxOption:ajaxOption
}

type PropsOption = Array<string>|{(...args:any[]):any};

function isFunction(s:any): s is Function {
    return s && s.constructor && s.constructor === Function;
}

function isArray(s:any): s is Array<any> {
    return s && s.constructor && s.constructor === Array;
}

function isString(s:any): s is string {
    return s && typeof s == "string";
}

type ajaxOption = {
    [key:string]:any
}

type ServiceOption = {
    props?:PropsOption
    ajax?:ajaxOption
    usemock?:boolean
    mock?:Function
    url?:string
    then?:{(...args:any[]):any}
    catch?:{(...args:any[]):any}
    [key:string]:any
}
//
const noAjaxOption = ["props","ajax","usemock","mock","then","catch"]
const getAjaxOptionFromOption = function(option:ServiceOption):ajaxOption{
    let rev:ajaxOption = {};
    for(let att in option){
        if(noAjaxOption.indexOf(att)<0){
            rev[att]=option[att]
        }
    }
    return rev;
}

const getProps = async function(props:PropsOption|undefined,args:any[],context:any){
    if(!props){return Promise.resolve(args)}
    return new Promise<any>((resolve,reject)=>{
        if(props != null){
            //处理参数 props 属性
            if(isFunction(props)){
                //若props为函数,将实参列表传入props,在props函数中this指向services,this.context指向当前配置，
                return Promise.resolve(props.apply(context,args))
                .then(resolve)["catch"](reject);
            } else if(isArray(props)){
                //若props为string[]，将实参列表传入props
                var rev:{[key:string]:any} = {};
                props.forEach(function(iprop,index){
                    rev[iprop] = args[index]||null;
                })
                return resolve(rev);
            } else {
                resolve(args)
            }
        }
        else {
            resolve(args)
        }
    })
}


export const version = "1.0.0";

export class ServiceCreater{

    ajax:IAjax
    ajaxOption:ajaxOption = {}

    constructor(option:ServiceCreaterOption){
        this.ajax = option.ajax;
        Object.assign(this.ajaxOption,option.ajaxOption)
    }

    public createServices(setting:{[key:string]:ServiceCreaterOption}){
        let rev:{[key:string]:{(...args:any[]):any}} = {};
        for(var a in setting){
            rev[a]=this.createService(setting[a])
        }
        return rev;
    }

    public createService(option:ServiceOption|string|{():any}):{(...args:any[]):any}{
        let opt:ServiceOption;
        if(option == null){
            throw "createService 参数错误"
        } else if (isFunction(option)){
            return function(this:{(...ps:any[]):any},...args:any){
                return Promise.resolve(option.apply(this,args));
            };
        } else if (isString(option)){
            opt = {url:option}
        } else {
            opt = option;
        }

        const salf = this;

        return function(this:any,...args:any[]):Promise<unknown>{
            var rev:Promise<any>;
            if(opt.props){
                rev = getProps(opt.props,args,this).then(d=>({data:d}))
            }else{
                let d;
                if(args.length==0){
                    d={}
                } else if(isString(opt.url)&&args.length==1){
                    d={data:args[0]}
                } else{
                    d={data:args}
                }
                rev = Promise.resolve(d)
            }
            if(opt.usemock){
                if(opt.mock && isFunction(opt.mock)){
                    let mockfn = opt.mock;
                    rev = rev.then(
                        (postData:{data?:any}):Promise<any>=>Promise.resolve((postData&&postData.data)?mockfn.call(salf,postData.data):mockfn.call(salf))
                    )
                }
            } else if(isString(opt.url)){
                let url = opt.url;
                rev = rev.then(
                    (postData:{data?:any}):Promise<any> => 
                    salf.ajax(url,Object.assign({},salf.ajaxOption,opt.ajax,getAjaxOptionFromOption(opt),postData))
                )
            }
            if(opt.then){
                rev = rev.then(opt.then)
            }
            if(opt.catch){
                rev = rev.catch(opt.catch)
            }else{
                rev = rev.catch(function(error:any){
                    throw error;
                })
            }
            return rev;
        }
    }

    static create(option:ServiceCreaterOption){
        return new ServiceCreater(option)
    }

    public setAjaxOption(ajaxOption:ajaxOption){
        Object.assign(this.ajaxOption,ajaxOption)
    } 

}