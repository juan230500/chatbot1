const mondoose = require('mongoose');
const Record = require('./models/record');
const axios = require('axios').default;

const instance = axios.create({
    baseURL: 'https://kz-product-manager-2.herokuapp.com'
  });

const isNumber = n => !isNaN(parseFloat(n)) && isFinite(n);
const getPhone = text => text.split(':').pop();

const mainLogic = async (body) => {
    let message;

    const userMessage = body.Body;
  
    const phone = getPhone(body.From);

    let record = await Record.findOne({phone:phone});

    if (!record){
        const newRecord = new Record({
        phone:phone,
        token:'',
        state:'ask-token',
        registerData:{}
        });
        await newRecord.save();
        record = newRecord;
    };
    if (record.state == "ask-token"){
        try{
            const response = await instance.post('/number',{phone:phone});
            record.token = response.data.token;
        }
        catch (err){
            console.log(err);
            record.token = "";
        }
        record.state = "init";
        await record.save();
    }
    instance.defaults.headers.common['Authorization'] = 'Bearer '+record.token;

    if(body.Body.toLowerCase()==="salir"){
        record.state = 'init';
        record.save();
        return(`
Ha cancelado el proceso actual.
1) Registro
2) Ver y confirmar pedidos pendientes
3) Ver y agregar a su catálogo de productos 
Para elegir una opción escriba alguno de los números de arriba.
Si desea cancelar o reiniciar algún proceso puede usar el comando "salir".
        `);
    }
    
    switch (record.state){
        case "init":
            switch (userMessage){
                case "1":
                    if (record.token){
                        message = "Su número ya está registrado. No hace falta registrarse.";
                    }
                    else{
                        message = "Ha accedido al proceso de registro. Para empezar brinde su nombre.";
                        record.state = 'register-name';
                    }
                    break;
                case "2":
                    if (!record.token){
                        message = "Su número no está registrado en el sistema. Primero registrese para acceder a las demás funciones";
                        break;
                    }
                    message = "Ha accedido al proceso de pedidos. Estos son sus pedidos pendientes:\n";
                    const response = await instance.get('/productores/orders?state=pendingConfirm');
                    items = response.data
                    record.itemsData = items;
                    for (i in items){
                        message += `${i}) ${items[i].quantity} de ${items[i].name} por $${items[i].totalPrice}\n`
                    }
                    message += "Use el comando 'Rechazar-4' o 'Aceptar-2' para aceptar pedido 2 por ejemplo";
                    record.state = 'order';
                    break;
                case "3":
                    if (!record.token){
                        message = "Su número no está registrado en el sistema. Primero registrese para acceder a las demás funciones";
                        break;
                    }
                    message = "Ha accedido al proceso de catálogo. Este es su catálogo actual:\n";
                    let stocks = await instance.get('/MyProducts');
                    stocks = stocks.data;
                    record.stocksData = stocks;
                    for (i in stocks){
                        message += `${i}) ${stocks[i].name} por $${stocks[i].price}\n`
                    }

                    message += "Estos son los productos que puede agregar:\n";
                    let products = await instance.get('/productores/allProducts');
                    products = products.data;
                    record.productsData = products;
                    for (i in products){
                        message += `${i}) ${products[i].name} y se mide en ${products[i].units}\n`
                    }

                    message += "Use el comando '2-200' para agregar papa (el producto número 2) por $200 el kilo por ejemplo";
                    record.state = 'stock';
                    break;
                default:
                    message =`
Hola, soy cultibot. Mi función es ayudar a los productores con las siguientes funcionalidades:
1) Registro
2) Ver y confirmar pedidos pendientes
3) Ver y agregar a su catálogo de productos 
Para elegir una opción escriba alguno de los números de arriba.
Si desea cancelar o reiniciar algún proceso puede usar el comando "salir".
                    `;
                    break;
            }
            break;
        case ("register-name"):
            record.registerData.name = userMessage;
            message = 'Se ha guardado su nombre. Por favor brinde su apellido.';
            record.state = 'register-lastname';
            break;
        case ("register-lastname"):
            record.registerData.lastname = userMessage;
            message = 'Se ha guardado su apellido. Por favor brinde su región de la siguiente lista:\n';
            const response = await instance.get('/region');
            let regions = response.data;
            record.regionsData = regions;
            console.log(regions)
            for (i in regions){
                message += `${i}) ${regions[i].name}\n`
            }
            record.state = 'register-region';
            break;
        case ("register-region"):
            if (isNumber(userMessage) && 0<=parseInt(userMessage) && parseInt(userMessage)<record.regionsData.length){
                const index = parseInt(userMessage);
                record.registerData.region = record.regionsData[index].name
                message = 'Se ha guardado su region. Por favor brinde su ubicación usando Google maps.';
                record.state = 'register-location';
            }
            else{
                message = 'Indique un número de región válido de la lista anterior.';
            }
            break;
        case ("register-location"):
            if(!body.Latitude){
                message = 'Esa ubicación no es válida. Por favor brinde su ubicación usando Google maps.';
                break;
            }
            record.registerData.location = {lat:body.Latitude,lng:body.Longitude};
            message = 'Se ha guardado su ubicación. Por favor brinde su email.';
            record.state = 'register-email';
            break;
        case ("register-email"):
            record.registerData.email = userMessage;
            message = 'Se ha guardado su email. Por favor brinde su contraseña (Tiene que tener 7 caracteres).';
            record.state = 'register-password';
            break;
        case ("register-password"):
            record.registerData.password = userMessage;
            record.registerData.role = "productor";
            record.registerData.phone = phone;
            try{
                const response1 = await instance.post("/productores",record.registerData);
                record.token = response1.data.token;
                message = 'Se ha guardado su contraseña. Su registro ha finalizado, muchas gracias.';
            }
            catch(err){
                console.log(err);
                message = 'Ha habido un error en el registro. Intentelo de nuevo siguiendo las intrucciones en cada paso, o bien contacte a servicio técnico';
            }
            
            record.state = 'init';
            break;
        case ("stock"):
            if (userMessage.split('-').length!==2){
                message = "Use el comando '2-200' para agregar papa (el producto número 2) por $200 el kilo por ejemplo";
                break;
            }
            let [productIndex,price] = userMessage.split('-');
            if (!isNumber(productIndex) || 0>parseInt(productIndex) || parseInt(productIndex)>=record.productsData.length){
                message = "Ese número de producto no es válido";
                break;
            }
            if (!isNumber(price)){
                message = "Ese precio no es válido. ";
                break;
            }
            price = parseFloat(price);
            productIndex = parseInt(productIndex);
            const product = record.productsData[productIndex];
            instance.post('/productores/producto',{price:price,name:product.name});

            message = `
Producto agregado a su catálogo.
Puede usar alguno de los siguientes procesos:
1) Registro
2) Ver y confirmar pedidos pendientes
3) Ver y agregar a su catálogo de productos 
Para elegir una opción escriba alguno de los números de arriba.
Si desea cancelar o reiniciar algún proceso puede usar el comando "salir".`;
            record.state = 'init';
            break;
        case ("order"):
            if (userMessage.split('-').length!==2){
                message = "Use el comando 'Rechazar-4' o 'Aceptar-2' para aceptar pedido 2 por ejemplo";
                break;
            }
            let [command,index] = userMessage.split('-')
            console.log(command,index);
            if (!isNumber(index) || 0>parseInt(index) || parseInt(index)>=record.itemsData.length){
                message = "Ese número de pedido no es válido. Use el comando 'Rechazar-4' o 'Aceptar-2' para aceptar pedido 2 por ejemplo";
                break;
            }
            if (command !== "Aceptar" && command !== "Rechazar"){
                message = "Ese comando no es válido. Use el comando 'Rechazar-4' o 'Aceptar-2' para aceptar pedido 2 por ejemplo";
                break;
            }
            index = parseInt(index);
            console.log(record.itemsData[index]);
            let id = record.itemsData[index]._id;
            if (command === "Aceptar"){
                message = `
Pedido aceptado.
Puede usar alguno de los siguientes procesos:
1) Registro
2) Ver y confirmar pedidos pendientes
3) Ver y agregar a su catálogo de productos 
Para elegir una opción escriba alguno de los números de arriba.
Si desea cancelar o reiniciar algún proceso puede usar el comando "salir".`;
                instance.patch('/productores/orders/'+id,{state:"pendingTransport"});
            }
            else{
                message = `
Pedido rechazado.
Puede usar alguno de los siguientes procesos:
1) Registro
2) Ver y confirmar pedidos pendientes
3) Ver y agregar a su catálogo de productos 
Para elegir una opción escriba alguno de los números de arriba.
Si desea cancelar o reiniciar algún proceso puede usar el comando "salir".`;
                instance.delete('/productores/orders/'+id);
            }
            
            record.state = 'init';
            break;
        default:
            message = "F";
            break;
    }

    record.markModified('registerData');
    record.save();

    return message;
}

module.exports = mainLogic;