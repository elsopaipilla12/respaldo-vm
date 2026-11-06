
Requisitos Previos

* Node.js y npm instalados.
* Docker instalado.
* Acceso al clúster de Kubernetes (`cluster-inf326-2026-2`) con `kubectl` y `k9s` configurados.
Instrucciones de Ejecución

Para ejecutar y probar el sistema completo, abre las siguientes terminales en paralelo:

### Terminal 1:
Utiliza `k9s` para supervisar el estado de los pods, los despliegues y los logs en tiempo real dentro del namespace correspondiente:
bash
k9s

### Terminal 2:
cd "api-gateway"
docker build -t ghcr.io/elsopaipilla12/api-gateway:latest .
docker push ghcr.io/elsopaipilla12/api-gateway:latest

###Terminal 3: 
kubectl port-forward svc/api-gateway-svc 3000:3000 -n grupo-reacciones

###Terminal 4: 
cd "frontend"
npm install
npm run dev
