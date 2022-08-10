# Check run action


#### Description
Wraps execution of command-line programs with check

#### Usage:
###### Configuration:
```yaml
      - name: add check
        uses: ogotalski/check-run-action@v1.3
        with:
          run: |
            chmod +x gradlew
            ls
            ./gradlew test jacocoTestReport
          name: Test
```


###### Example workflow:
```yaml
name: Measure coverage

on:
  pull_request:
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up JDK 1.8
        uses: actions/setup-java@v1
        id: setup
        with:
          java-version: 1.8
      - name: Dump steps context
        run: echo '${{ toJSON(steps) }}'
      - name: add check
        id: test
        uses: ogotalski/check-run-action@v1.3
        with:
          run: |
            chmod +x gradlew
            ls
            ./gradlew test jacocoTestReport
          name: Test
      - name: Test coverage report
        if: ${{steps.test.output.conclusion == 'success'}}
        uses: ogotalski/test-coverage-report@download_artifact
        with:
          paths: ${{ github.workspace }}/build/reports/jacoco/test/jacocoTestReport.xml,${{ github.workspace }}/MathUtils/build/reports/jacoco/test/jacocoTestReport.xml
          sourcePaths: ${{ github.workspace }}/src/main/kotlin,${{ github.workspace }}/MathUtils/src/main/java
          masterPaths: ${{ github.workspace }}/code-coverage-report/build/reports/jacoco/test/jacocoTestReport.xml,${{ github.workspace }}/code-coverage-report/MathUtils/build/reports/jacoco/test/jacocoTestReport.xml
          updateComment: true
          debug: true
          artifactWorkflow: main.yml
          artifactName: code-coverage-report
          downloadPath: code-coverage-report
```
