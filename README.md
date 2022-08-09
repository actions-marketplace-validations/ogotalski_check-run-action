# Step to check action

[![units-test](https://github.com/ogotalski/step-to-check-action/actions/workflows/test.yml/badge.svg)](https://github.com/ogotalski/step-to-check-action/actions/workflows/test.yml)

#### Description
Creates check to PR based on previous step result May be used if you want to run several checks in one job because preparing runner could be time consuming  


#### Usage:
###### Configuration:
```yaml
      - name: add check
        if: always()
        uses: ogotalski/step-to-check-action@V1.0
        with:
          #Optional Output for check summary details
          outputFile: ${{ github.workspace }}/output.txt
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
      - name: Run Coverage
        run: |
          chmod +x gradlew
          ./gradlew test jacocoTestReport | tee ${{ github.workspace }}/output.txt
        continue-on-error: true
      - name: add check
        if: always()
        uses: ogotalski/step-to-check-action@V1.0
        with:
          outputFile: ${{ github.workspace }}/output.txt
```
