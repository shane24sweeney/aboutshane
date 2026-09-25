# Called by `sam build` (BuildMethod: makefile). Paths are relative to this file so the
# build works from any working directory. Tests run separately in CI (`mvn verify`).
BACKEND_DIR := $(patsubst %/,%,$(dir $(abspath $(lastword $(MAKEFILE_LIST)))))

build-BackendFunction:
	mvn -B -q -f $(BACKEND_DIR)/pom.xml package -DskipTests
	mkdir -p $(ARTIFACTS_DIR)
	cd $(ARTIFACTS_DIR) && jar xf $(BACKEND_DIR)/target/contact-api-0.0.1-SNAPSHOT-lambda.jar
