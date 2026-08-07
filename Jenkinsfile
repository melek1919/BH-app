// Jenkinsfile — Pipeline build + push + test + health + cleanup
// Stages : Checkout → Unit tests → Build & tag → Health check → Push → Cleanup
// Les tests (vitest) et le health check s'exécutent via le moteur Docker
// (conteneur `jenkins-docker`) ; ils font échouer le build si le code est cassé.
pipeline {
    agent any

    environment {
        REGISTRY      = 'melek1919'
        BACKEND_IMAGE = "${REGISTRY}/bh-app-backend"
        FRONTEND_IMAGE = "${REGISTRY}/bh-app-frontend"
        IMAGE_TAG     = "${BUILD_NUMBER}"
        VITE_API_URL  = '/api'
        TEST_IMG      = "${REGISTRY}/bh-app-backend-test"
        TEST_CTR      = 'bh-healthcheck'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        // Tests unitaires backend (vitest) dans le stage "builder" de l'image Docker.
        // Le conteneur Jenkins n'a pas node : on construit l'étape builder (npm ci + code)
        // puis on exécute `npm test`. Cette gate fait échouer le build si un test casse.
        stage('Unit tests (vitest)') {
            steps {
                sh "docker build --target builder -t ${TEST_IMG}:${IMAGE_TAG} ./server"
                sh "docker run --rm ${TEST_IMG}:${IMAGE_TAG} npm test"
            }
        }

        stage('Build & tag images') {
            steps {
                sh "docker build -t ${BACKEND_IMAGE}:${IMAGE_TAG} -t ${BACKEND_IMAGE}:latest ./server"
                sh "docker build --build-arg VITE_API_URL=${VITE_API_URL} -t ${FRONTEND_IMAGE}:${IMAGE_TAG} -t ${FRONTEND_IMAGE}:latest ./client"
            }
        }

        // Health check : lance un conteneur backend et vérifie GET /api/health.
        // Échoue le build si l'API ne répond pas 200.
        stage('Health check') {
            steps {
                sh "docker run -d --name ${TEST_CTR} ${BACKEND_IMAGE}:${IMAGE_TAG}"
                sh 'sleep 8'
                sh """docker exec ${TEST_CTR} node -e \"fetch('http://localhost:5000/api/health').then(r=>(r.status===200?console.log('HEALTH OK'):process.exit(1))).catch(e=>{console.error(e.message);process.exit(1)})\" """
            }
        }

        stage('Push images (Docker Hub)') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'melek1919',
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_PASS'
                    )
                ]) {
                    sh 'echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin'
                    sh "docker push ${BACKEND_IMAGE}:${IMAGE_TAG}"
                    sh "docker push ${BACKEND_IMAGE}:latest"
                    sh "docker push ${FRONTEND_IMAGE}:${IMAGE_TAG}"
                    sh "docker push ${FRONTEND_IMAGE}:latest"
                }
            }
        }
    }

    post {
        always {
            // Nettoyage : conteneur de test, image de test, connexion, espaces Docker et workspace.
            sh "docker rm -f ${TEST_CTR} || true"
            sh "docker rmi -f ${TEST_IMG}:${IMAGE_TAG} || true"
            sh 'docker logout || true'
            sh 'docker system prune -f || true'
            cleanWs()
        }
    }
}