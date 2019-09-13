import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { FaAngleRight, FaAngleLeft, FaSpinner } from 'react-icons/fa';
import api from '../../Services/api';

import Container from '../../components/Container';

import {
  Loading,
  Owner,
  IssueList,
  Select,
  PrevButton,
  NextButton,
} from './styles';

export default class Repository extends Component {
  static propTypes = {
    match: PropTypes.shape({
      params: PropTypes.shape({
        repository: PropTypes.string,
      }),
    }).isRequired,
  };

  state = {
    repository: {},
    issues: [],
    loading: true,
    loadingButton: false,
    filter: 'all',
    page: 1,
  };

  async componentDidMount() {
    const { match } = this.props;

    const repoName = decodeURIComponent(match.params.repository);

    const [repository, issues] = await Promise.all([
      api.get(`/repos/${repoName}`),
      api.get(`/repos/${repoName}/issues`, {
        params: {
          state: 'all',
          per_page: 5,
        },
      }),
    ]);

    this.setState({
      repository: repository.data,
      issues: issues.data,
      loading: false,
    });
  }

  handleSelectChange = async e => {
    const filter = e.target.value;
    console.log('handleSelectChange');
    console.log(filter);
    const { match } = this.props;

    const repoName = decodeURIComponent(match.params.repository);

    const [repository, issues] = await Promise.all([
      api.get(`/repos/${repoName}`),
      api.get(`/repos/${repoName}/issues`, {
        params: {
          state: filter,
          per_page: 5,
          page: 1,
        },
      }),
    ]);

    this.setState({
      repository: repository.data,
      issues: issues.data,
      loading: false,
      page: 1,
      filter,
    });
  };

  handlePrevClick = async () => {
    this.setState({
      loadingButton: true,
    });
    const { match } = this.props;
    const { page, filter } = this.state;

    const repoName = decodeURIComponent(match.params.repository);

    const [repository, issues] = await Promise.all([
      api.get(`/repos/${repoName}`),
      api.get(`/repos/${repoName}/issues`, {
        params: {
          state: filter,
          per_page: 5,
          page: page === 1 ? 1 : page - 1,
        },
      }),
    ]);

    this.setState({
      repository: repository.data,
      issues: issues.data,
      loadingButton: false,
      page: page === 1 ? 1 : page - 1,
    });
    console.log(`Previous - Page = ${page}`);
    console.log(page === 1 ? 1 : page - 1);
  };

  handleNextClick = async () => {
    this.setState({
      loadingButton: true,
    });
    const { match } = this.props;
    const { page, filter } = this.state;

    const repoName = decodeURIComponent(match.params.repository);
    const nextPage = page + 1;
    const [repository, issuesTemp] = await Promise.all([
      api.get(`/repos/${repoName}`),
      api.get(`/repos/${repoName}/issues`, {
        params: {
          state: filter,
          per_page: 5,
          page: nextPage,
        },
      }),
    ]);

    let issues = {};
    if (issuesTemp.data.length > 0) {
      issues = issuesTemp;
      this.setState({
        repository: repository.data,
        issues: issues.data,
        loadingButton: false,
        page: nextPage,
      });
    } else {
      issues = await api.get(`/repos/${repoName}/issues`, {
        params: {
          state: filter,
          per_page: 5,
          page: nextPage - 1,
        },
      });
      this.setState({
        repository: repository.data,
        issues: issues.data,
        loadingButton: false,
        page: nextPage - 1,
      });
    }

    console.log(issues.data.length);
    console.log(issues.data.length > 0 ? page + 1 : page);
  };

  render() {
    const { repository, issues, loading, loadingButton, page } = this.state;
    console.log(page);

    const prevDisable = page === 1 || loadingButton;

    console.log(prevDisable);
    if (loading) {
      return <Loading>Carregando</Loading>;
    }
    return (
      <Container>
        <Owner>
          <Link to="/">Voltar aos repositórios</Link>
          <img src={repository.owner.avatar_url} alt={repository.owner.login} />
          <h1>{repository.name}</h1>
          <p>{repository.description}</p>
        </Owner>
        <div className="filter">
          <Select id="stateSelect" onChange={this.handleSelectChange}>
            <option value="all">All</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </Select>
          <div className="nav">
            <PrevButton
              spin={loadingButton}
              loading={prevDisable}
              onClick={this.handlePrevClick}
            >
              {loadingButton ? (
                <FaSpinner color="#FFF" size={14} />
              ) : (
                <FaAngleLeft color="#FFF" size={14} />
              )}
            </PrevButton>
            <NextButton loading={loadingButton} onClick={this.handleNextClick}>
              {loadingButton ? (
                <FaSpinner color="#FFF" size={14} />
              ) : (
                <FaAngleRight color="#FFF" size={14} />
              )}
            </NextButton>
          </div>
        </div>
        <IssueList>
          {issues.map(issue => (
            <li key={String(issue.id)}>
              <img src={issue.user.avatar_url} alt={issue.user.login} />
              <div>
                <strong>
                  <a href={issue.html_url}>{issue.title}</a>
                  {issue.labels.map(label => (
                    <span key={String(label.id)}>{label.name}</span>
                  ))}
                </strong>
                <p>{issue.user.login}</p>
              </div>
            </li>
          ))}
        </IssueList>
      </Container>
    );
  }
}
