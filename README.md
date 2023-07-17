# proyecto_gpu

```bash
npm install
node app.js
```

De momento solo está la parte de la API. Para probarla, se puede usar Postman o similar. La API está en el puerto 3000.

```
curl --location --request POST 'http://localhost:3000/process-image' \
--form 'image=@"/path/image/name.jpg"'
```

La salida tiene el formato:

```
"landmarks": [
        [
            {
                "_x": 332.833198569715,
                "_y": 208.07798411437142
            },
            {
                "_x": 335.4965223968029,
                "_y": 235.8213532764541
            },
            ...
        ]
]
```