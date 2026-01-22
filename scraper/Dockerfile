FROM public.ecr.aws/lambda/python:3.11

WORKDIR ${LAMBDA_TASK_ROOT}

RUN yum update -y && \
    yum install -y postgresql-devel gcc python3-devel make

COPY requirements.txt .

RUN pip install -r requirements.txt

COPY seed_farms.py .

CMD [ "seed_farms.lambda_handler" ]