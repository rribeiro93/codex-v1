db.getCollection("categories").find({})

//db.getCollection('categories').aggregate([
//
//  // 2. Agrupa pelo campo 'place', o que remove as duplicatas (Distinct)
//  { $group: { _id: "$name" } },
//
//  // 3. Opcional: Ordena alfabeticamente para facilitar a visualização
//  { $sort: { _id: 1 } },
//
//  // 4. Formata a saída para vir apenas uma lista de strings
//  { $group: { 
//      _id: null, 
//      categories: { $push: "$_id" } 
//    } 
//  },
//
//  // 5. Remove o _id do resultado final
//  { $project: { _id: 0, categories: 1 } }
//]).toArray();